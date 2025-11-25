export class TotalExtractor {
    private totalSelector?: string;

    constructor(totalSelector?: string) {
        this.totalSelector = totalSelector
            ? this.cleanSelector(totalSelector)
            : undefined;
    }

    private cleanSelector(selector: string): string {
        // Remove excessive backslash escaping that can occur when fetching from database
        // Convert double backslashes to single backslashes
        return selector.replace(/\\\\/g, "\\");
    }

    public extractTotal(): number {
        if (!this.totalSelector) {
            return 0;
        }

        try {
            const element = document.querySelector(this.totalSelector);
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

            const hasComma = cleanTotal.includes(",");
            const hasDot = cleanTotal.includes(".");

            if (hasComma && hasDot) {
                // Both comma and dot exist - determine which is decimal separator
                // Check the last separator and digits after it
                const lastCommaIndex = cleanTotal.lastIndexOf(",");
                const lastDotIndex = cleanTotal.lastIndexOf(".");

                if (lastCommaIndex > lastDotIndex) {
                    // Comma is last - check if it's decimal (usually 2 digits) or thousands (3 digits)
                    const afterComma = cleanTotal.substring(lastCommaIndex + 1);
                    if (afterComma.length === 2) {
                        // European format: dot=thousands, comma=decimal (e.g., "1.234,56")
                        cleanTotal = cleanTotal.replace(/\./g, ""); // Remove all dots (thousands)
                        cleanTotal = cleanTotal.replace(",", "."); // Replace comma with dot (decimal)
                    } else {
                        // US format: comma=thousands, dot=decimal (e.g., "1,234.56")
                        cleanTotal = cleanTotal.replace(/,/g, ""); // Remove all commas (thousands)
                    }
                } else {
                    // Dot is last - US format: comma=thousands, dot=decimal
                    cleanTotal = cleanTotal.replace(/,/g, ""); // Remove all commas (thousands)
                }
            } else if (hasComma && !hasDot) {
                // Only comma exists - check if it's thousands or decimal separator
                // Count all commas and check pattern
                const commaMatches = cleanTotal.match(/,/g);
                const commaCount = commaMatches ? commaMatches.length : 0;

                if (commaCount > 1) {
                    // Multiple commas = thousands separators (e.g., "1,234,567")
                    cleanTotal = cleanTotal.replace(/,/g, "");
                } else {
                    // Single comma - check digits after it
                    const commaMatch = cleanTotal.match(/,(\d+)$/);
                    if (commaMatch && commaMatch[1].length === 3) {
                        // It's a thousands separator, remove it
                        cleanTotal = cleanTotal.replace(",", "");
                    } else {
                        // It's a decimal separator (European format), replace with dot
                        cleanTotal = cleanTotal.replace(",", ".");
                    }
                }
            } else if (!hasComma && hasDot) {
                // Only dot exists - check if it's thousands or decimal separator
                // Count all dots and check pattern
                const dotMatches = cleanTotal.match(/\./g);
                const dotCount = dotMatches ? dotMatches.length : 0;

                if (dotCount > 1) {
                    // Multiple dots = thousands separators (e.g., "1.234.567")
                    cleanTotal = cleanTotal.replace(/\./g, "");
                } else {
                    // Single dot - check digits after it
                    const dotMatch = cleanTotal.match(/\.(\d+)$/);
                    if (dotMatch && dotMatch[1].length === 3) {
                        // It's a thousands separator, remove it
                        cleanTotal = cleanTotal.replace(".", "");
                    }
                    // Otherwise keep the dot as decimal separator
                }
            }

            const total = parseFloat(cleanTotal);

            if (isNaN(total)) {
                console.warn(`Could not parse total value: ${totalText}`);
                return 0;
            }

            // Round to the nearest whole number
            return Math.round(total);
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
}
