import { ProductMapping } from "../types";

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
        this.productMapping = this.cleanProductMapping(productMapping);
    }

    private cleanProductMapping(
        productMapping: ProductMapping
    ): ProductMapping {
        if (!productMapping) return productMapping;

        // Handle fields structure
        if (productMapping.fields) {
            const cleanedMapping: ProductMapping = { ...productMapping };
            const cleanedFields: any = {};

            for (const [fieldName, fieldSelector] of Object.entries(
                productMapping.fields
            )) {
                cleanedFields[fieldName] = this.cleanSelector(
                    fieldSelector as string
                );
            }
            cleanedMapping.fields = cleanedFields;

            return cleanedMapping;
        }

        return productMapping;
    }

    private cleanSelector(selector: string): string {
        // Remove excessive backslash escaping that can occur when fetching from database
        // Convert double backslashes to single backslashes
        return selector.replace(/\\\\/g, "\\");
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

        // Handle fields mapping structure
        if (this.productMapping.fields) {
            return this.detectProductsWithFieldsMapping();
        }

        return products;
    }

    private detectProductsWithFieldsMapping(): DetectedProduct[] {
        const products: DetectedProduct[] = [];
        const fieldsMapping = this.productMapping.fields;

        if (!fieldsMapping) {
            return products;
        }

        // For the new structure, we need to find a common parent element
        // that contains all the fields. Let's try to find a reasonable selector
        const allSelectors = Object.values(fieldsMapping) as string[];
        const commonParent = this.findCommonParentSelector(allSelectors);

        if (commonParent) {
            const elements = document.querySelectorAll(commonParent);
            elements.forEach((element) => {
                const product = this.extractProductFromFieldsMapping(
                    element,
                    fieldsMapping
                );
                if (product && Object.keys(product).length > 0) {
                    products.push(product);
                }
            });
        } else {
            // If we can't find a common parent, try to extract from the document root
            const product = this.extractProductFromFieldsMapping(
                document.body,
                fieldsMapping
            );
            if (product && Object.keys(product).length > 0) {
                products.push(product);
            }
        }

        return products;
    }

    private findCommonParentSelector(selectors: string[]): string | null {
        // Try to find a common parent by looking for common patterns
        // This is a simplified approach - in practice, you might need more sophisticated logic

        // Check if all selectors start with the same root
        const firstSelector = selectors[0];
        if (!firstSelector) return null;

        // Try to find a common prefix
        const parts = firstSelector.split(" > ");
        if (parts.length > 1) {
            const commonPrefix = parts[0];
            // Check if all selectors start with this prefix
            const allStartWithPrefix = selectors.every((selector) =>
                selector.startsWith(commonPrefix)
            );
            if (allStartWithPrefix) {
                return commonPrefix;
            }
        }

        // If no common prefix found, try to find a reasonable parent
        // Look for common patterns like body, main, #content, etc.
        const commonParents = [
            "body",
            "main",
            "#content",
            "#main",
            ".main",
            ".content",
        ];
        for (const parent of commonParents) {
            const elements = document.querySelectorAll(parent);
            if (elements.length > 0) {
                return parent;
            }
        }

        return null;
    }

    private extractProductFromFieldsMapping(
        element: Element,
        fieldsMapping: any
    ): DetectedProduct | null {
        try {
            const product: DetectedProduct = {};

            for (const [fieldName, selector] of Object.entries(fieldsMapping)) {
                const value = this.extractValue(element, selector as string);
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

            return Object.keys(product).length > 0 ? product : null;
        } catch (error) {
            console.warn(
                "Error extracting product from fields mapping:",
                error
            );
            return null;
        }
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
        // First, remove common currency prefixes like NOK, $, €, etc.
        let cleanPrice = priceText.replace(/^[A-Z]{3}\s*/i, ""); // Remove "NOK " prefix
        cleanPrice = cleanPrice.replace(/^[€$£¥]\s*/i, ""); // Remove currency symbols

        // Remove any remaining non-digit characters except dots and commas
        cleanPrice = cleanPrice.replace(/[^\d.,]/g, "");

        // Handle comma as thousand separator (like 1,500 -> 1500)
        if (cleanPrice.includes(",")) {
            // If there's a comma and it's followed by exactly 3 digits, it's likely a thousand separator
            const parts = cleanPrice.split(",");
            if (parts.length === 2 && parts[1].length === 3) {
                cleanPrice = parts[0] + parts[1]; // Remove comma for thousand separator
            } else {
                cleanPrice = cleanPrice.replace(",", "."); // Replace comma with dot for decimal
            }
        }

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
