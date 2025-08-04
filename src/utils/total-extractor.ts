import { decodeSelector } from "./selector-decoder";

export class TotalExtractor {
    private totalSelector?: string;

    constructor(totalSelector?: string) {
        // Decode the total selector if provided
        this.totalSelector = totalSelector
            ? decodeSelector(totalSelector)
            : undefined;
    }

    public extractTotal(): number {
        if (!this.totalSelector) {
            return 0;
        }

        try {
            // Handle complex selectors that may not work with querySelector
            let querySelector = this.totalSelector;

            // Remove CSS escaping backslashes
            querySelector = querySelector.replace(/\\/g, "");

            // For complex selectors with special characters, try a simplified approach
            // If the selector contains problematic characters, try to find a simpler alternative
            if (
                querySelector.includes("!") ||
                querySelector.includes("[") ||
                querySelector.includes(":")
            ) {
                // Try to extract a simpler selector that will work
                const simpleSelector =
                    this.extractSimpleSelector(querySelector);
                if (simpleSelector) {
                    querySelector = simpleSelector;
                }
            }

            const element = document.querySelector(querySelector);
            if (!element) {
                console.warn(`Total selector not found: ${this.totalSelector}`);
                return 0;
            }

            const totalText = element.textContent?.trim() || "";
            if (!totalText) {
                console.warn(
                    `No text content found for total selector: ${this.totalSelector}`
                );
                return 0;
            }

            // Remove currency symbols and convert to number
            // Handle both comma and dot as decimal separators
            let cleanTotal = totalText.replace(/[^\d.,]/g, "");

            // If there's a comma, treat it as decimal separator (European format)
            if (cleanTotal.includes(",") && !cleanTotal.includes(".")) {
                cleanTotal = cleanTotal.replace(",", ".");
            } else if (cleanTotal.includes(",") && cleanTotal.includes(".")) {
                // If both comma and dot exist, assume comma is thousands separator
                cleanTotal = cleanTotal.replace(",", "");
            }

            const total = parseFloat(cleanTotal);

            if (isNaN(total)) {
                console.warn(`Could not parse total value: ${totalText}`);
                return 0;
            }

            return total;
        } catch (error) {
            console.warn(
                `Error extracting total with selector: ${this.totalSelector}`,
                error
            );
            return 0;
        }
    }

    public hasTotalSelector(): boolean {
        return !!this.totalSelector;
    }

    private extractSimpleSelector(complexSelector: string): string | null {
        // Try to extract a simple selector from a complex one
        // Look for common patterns that can be simplified

        // If it's a complex selector with nth-child, try to extract just the nth-child part
        const nthChildMatch = complexSelector.match(/p:nth-child\((\d+)\)/);
        if (nthChildMatch) {
            const childIndex = nthChildMatch[1];
            // Try to find a parent element that we can use
            const parentMatch = complexSelector.match(
                /([a-zA-Z0-9_-]+)\s*>\s*[a-zA-Z0-9_-]+\s*>\s*[a-zA-Z0-9_-]+\s*>\s*[a-zA-Z0-9_-]+\s*>\s*[a-zA-Z0-9_-]+\s*>\s*p:nth-child/
            );
            if (parentMatch) {
                return `#${parentMatch[1]} p:nth-child(${childIndex})`;
            }

            // If we can't find a specific parent, try a more generic approach
            // Look for any ID in the selector
            const idMatch = complexSelector.match(/#([a-zA-Z0-9_-]+)/);
            if (idMatch) {
                return `#${idMatch[1]} p:nth-child(${childIndex})`;
            }
        }

        // If we can't extract a simple selector, return null
        return null;
    }
}
