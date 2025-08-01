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
}
