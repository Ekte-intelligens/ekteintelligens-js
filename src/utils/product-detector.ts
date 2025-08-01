import { ProductMapping } from "../types";
import { decodeProductMapping } from "./selector-decoder";

export interface DetectedProduct {
    id?: string;
    name?: string;
    price?: number;
    quantity?: number;
    [key: string]: any;
}

export class ProductDetector {
    private productMapping: ProductMapping;

    constructor(productMapping: ProductMapping) {
        // Decode the product mapping selectors
        this.productMapping = decodeProductMapping(productMapping);
    }

    public detectProducts(): DetectedProduct[] {
        const products: DetectedProduct[] = [];

        // If no product mapping, try to detect common e-commerce patterns
        if (
            !this.productMapping ||
            Object.keys(this.productMapping).length === 0
        ) {
            return this.detectCommonProducts();
        }

        // Use the product mapping to detect products
        for (const [selector, config] of Object.entries(this.productMapping)) {
            // Handle multiple selectors (comma-separated)
            const selectors = selector.includes(",")
                ? selector.split(",").map((s) => s.trim())
                : [selector];

            for (const sel of selectors) {
                const elements = document.querySelectorAll(sel);

                elements.forEach((element) => {
                    const product = this.extractProductFromElement(
                        element,
                        config
                    );
                    if (product && Object.keys(product).length > 0) {
                        products.push(product);
                    }
                });
            }
        }

        return products;
    }

    private detectCommonProducts(): DetectedProduct[] {
        const products: DetectedProduct[] = [];

        // Common e-commerce product selectors
        const commonSelectors = [
            "[data-product-id]",
            ".product-item",
            ".cart-item",
            "[data-sku]",
            ".product",
            ".item",
        ];

        for (const selector of commonSelectors) {
            const elements = document.querySelectorAll(selector);

            elements.forEach((element) => {
                const product = this.extractProductFromCommonElement(element);
                if (product) {
                    products.push(product);
                }
            });
        }

        return products;
    }

    private extractProductFromElement(
        element: Element,
        config: any
    ): DetectedProduct | null {
        try {
            const product: DetectedProduct = {};

            // Extract standard fields if provided
            if (config.id_selector) {
                const idValue = this.extractValue(element, config.id_selector);
                if (idValue !== null) {
                    product.id = idValue;
                }
            }
            if (config.name_selector) {
                const nameValue = this.extractValue(
                    element,
                    config.name_selector
                );
                if (nameValue !== null) {
                    product.name = nameValue;
                }
            }
            if (config.price_selector) {
                product.price = this.extractPrice(
                    element,
                    config.price_selector
                );
            }
            if (config.quantity_selector) {
                product.quantity = this.extractQuantity(
                    element,
                    config.quantity_selector
                );
            }

            // Add custom fields from config
            if (config.fields) {
                for (const [fieldName, selector] of Object.entries(
                    config.fields
                )) {
                    const value = this.extractValue(
                        element,
                        selector as string
                    );
                    if (value !== null) {
                        // Handle price fields specially
                        if (fieldName.toLowerCase().includes("price")) {
                            product[fieldName] = this.extractPrice(
                                element,
                                selector as string
                            );
                        } else {
                            product[fieldName] = value;
                        }
                    }
                }
            }

            // Add any additional fields from config (backward compatibility)
            if (config.additional_fields) {
                for (const [field, selector] of Object.entries(
                    config.additional_fields
                )) {
                    const value = this.extractValue(
                        element,
                        selector as string
                    );
                    if (value !== null) {
                        product[field] = value;
                    }
                }
            }

            // Return product if we have any data
            return Object.keys(product).length > 0 ? product : null;
        } catch (error) {
            console.warn("Error extracting product from element:", error);
            return null;
        }
    }

    private extractProductFromCommonElement(
        element: Element
    ): DetectedProduct | null {
        try {
            const product: DetectedProduct = {
                id:
                    this.extractValue(element, "data-product-id") ||
                    this.extractValue(element, "data-sku") ||
                    this.extractValue(element, "id") ||
                    "",
                name:
                    this.extractValue(element, "data-product-name") ||
                    this.extractValue(element, "title") ||
                    this.extractTextContent(
                        element,
                        ".product-name, .item-name, .title"
                    ) ||
                    "",
                price:
                    this.extractPrice(element, "data-price") ||
                    this.extractPrice(element, "data-price-amount") ||
                    0,
                quantity:
                    this.extractQuantity(element, "data-quantity") ||
                    this.extractQuantity(element, "quantity") ||
                    1,
            };

            return product.id || product.name ? product : null;
        } catch (error) {
            console.warn(
                "Error extracting product from common element:",
                error
            );
            return null;
        }
    }

    private extractValue(element: Element, selector: string): string | null {
        try {
            if (selector.startsWith("data-")) {
                return element.getAttribute(selector) || null;
            }

            // Handle complex selectors that start with >
            if (selector.startsWith(">")) {
                try {
                    const targetElement = element.querySelector(selector);
                    return targetElement
                        ? targetElement.textContent?.trim() || null
                        : null;
                } catch (error) {
                    console.warn(`Invalid selector: ${selector}`, error);
                    return null;
                }
            }

            // Handle multiple selectors (comma-separated)
            if (selector.includes(",")) {
                const selectors = selector.split(",").map((s) => s.trim());
                for (const sel of selectors) {
                    try {
                        const targetElement = element.querySelector(sel);
                        if (targetElement) {
                            return targetElement.textContent?.trim() || null;
                        }
                    } catch (error) {
                        console.warn(
                            `Invalid selector in comma list: ${sel}`,
                            error
                        );
                        continue;
                    }
                }
                return null;
            }

            const targetElement = element.querySelector(selector);
            return targetElement
                ? targetElement.textContent?.trim() || null
                : null;
        } catch (error) {
            console.warn(
                `Error extracting value with selector: ${selector}`,
                error
            );
            return null;
        }
    }

    private extractTextContent(
        element: Element,
        selector: string
    ): string | null {
        const targetElement = element.querySelector(selector);
        return targetElement ? targetElement.textContent?.trim() || null : null;
    }

    private extractPrice(element: Element, selector: string): number {
        const priceText = this.extractValue(element, selector);
        if (!priceText) return 0;

        // Remove currency symbols and convert to number
        const cleanPrice = priceText.replace(/[^\d.,]/g, "").replace(",", ".");
        const price = parseFloat(cleanPrice);
        return isNaN(price) ? 0 : price;
    }

    private extractQuantity(element: Element, selector: string): number {
        const quantityText = this.extractValue(element, selector);
        if (!quantityText) return 1;

        const quantity = parseInt(quantityText);
        return isNaN(quantity) ? 1 : quantity;
    }
}
