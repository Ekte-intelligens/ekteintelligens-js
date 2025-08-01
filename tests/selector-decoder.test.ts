import {
    decodeSelector,
    decodeProductMapping,
} from "../src/utils/selector-decoder";

describe("Selector Decoder", () => {
    describe("decodeSelector", () => {
        it("should decode a base64 encoded selector", () => {
            // Test with a simple selector
            const encoded = btoa(encodeURIComponent(".product-item"));
            const decoded = decodeSelector(encoded);
            expect(decoded).toBe(".product-item");
        });

        it("should decode a selector with special characters", () => {
            // Test with a selector containing special characters
            const original = '[data-product-id="123"]';
            const encoded = btoa(encodeURIComponent(original));
            const decoded = decodeSelector(encoded);
            expect(decoded).toBe(original);
        });

        it("should handle complex selectors", () => {
            // Test with a complex selector
            const original =
                '.product-item[data-price="29.99"] > .product-name';
            const encoded = btoa(encodeURIComponent(original));
            const decoded = decodeSelector(encoded);
            expect(decoded).toBe(original);
        });

        it("should return original string if decoding fails", () => {
            // Test with invalid base64
            const invalid = "invalid-base64-string";
            const decoded = decodeSelector(invalid);
            expect(decoded).toBe(invalid);
        });

        it("should handle empty string", () => {
            const decoded = decodeSelector("");
            expect(decoded).toBe("");
        });
    });

    describe("decodeProductMapping", () => {
        it("should decode all selectors in product mapping", () => {
            const productMapping = {
                [btoa(encodeURIComponent(".product-item"))]: {
                    id_selector: btoa(encodeURIComponent("[data-product-id]")),
                    name_selector: btoa(encodeURIComponent(".product-name")),
                    price_selector: btoa(encodeURIComponent("[data-price]")),
                    fields: {
                        category: btoa(encodeURIComponent(".product-category")),
                    },
                },
            };

            const decoded = decodeProductMapping(productMapping);

            expect(decoded).toEqual({
                ".product-item": {
                    id_selector: "[data-product-id]",
                    name_selector: ".product-name",
                    price_selector: "[data-price]",
                    fields: {
                        category: ".product-category",
                    },
                },
            });
        });

        it("should handle null or undefined input", () => {
            expect(decodeProductMapping(null)).toBeNull();
            expect(decodeProductMapping(undefined)).toBeUndefined();
        });

        it("should handle empty object", () => {
            expect(decodeProductMapping({})).toEqual({});
        });

        it("should handle non-object input", () => {
            expect(decodeProductMapping("string")).toBe("string");
            expect(decodeProductMapping(123)).toBe(123);
        });
    });
});
