/**
 * Decodes an encoded selector string from the backend
 * @param encoded The encoded selector string
 * @returns The decoded selector string
 */
export function decodeSelector(encoded: string): string {
    try {
        // First decode base64, then decode URI component
        return decodeURIComponent(atob(encoded));
    } catch (error) {
        console.warn("Failed to decode selector:", encoded, error);
        return encoded; // Return original if decoding fails
    }
}

/**
 * Decodes all selectors in a product mapping object
 * @param productMapping The product mapping object with potentially encoded selectors
 * @returns The product mapping with decoded selectors
 */
export function decodeProductMapping(productMapping: any): any {
    if (!productMapping || typeof productMapping !== "object") {
        return productMapping;
    }

    const decodedMapping: any = {};

    for (const [selector, config] of Object.entries(productMapping)) {
        // Decode the main selector
        const decodedSelector = decodeSelector(selector);

        // Decode selectors within the config
        const decodedConfig: any =
            typeof config === "object" && config !== null
                ? { ...config }
                : config;

        if (decodedConfig && typeof decodedConfig === "object") {
            if (decodedConfig.id_selector) {
                decodedConfig.id_selector = decodeSelector(
                    decodedConfig.id_selector
                );
            }
            if (decodedConfig.name_selector) {
                decodedConfig.name_selector = decodeSelector(
                    decodedConfig.name_selector
                );
            }
            if (decodedConfig.price_selector) {
                decodedConfig.price_selector = decodeSelector(
                    decodedConfig.price_selector
                );
            }
            if (decodedConfig.quantity_selector) {
                decodedConfig.quantity_selector = decodeSelector(
                    decodedConfig.quantity_selector
                );
            }

            // Decode selectors in fields
            if (decodedConfig.fields) {
                const decodedFields: any = {};
                for (const [fieldName, fieldSelector] of Object.entries(
                    decodedConfig.fields
                )) {
                    decodedFields[fieldName] = decodeSelector(
                        fieldSelector as string
                    );
                }
                decodedConfig.fields = decodedFields;
            }

            // Decode selectors in additional_fields
            if (decodedConfig.additional_fields) {
                const decodedAdditionalFields: any = {};
                for (const [fieldName, fieldSelector] of Object.entries(
                    decodedConfig.additional_fields
                )) {
                    decodedAdditionalFields[fieldName] = decodeSelector(
                        fieldSelector as string
                    );
                }
                decodedConfig.additional_fields = decodedAdditionalFields;
            }
        }

        decodedMapping[decodedSelector] = decodedConfig;
    }

    return decodedMapping;
}
