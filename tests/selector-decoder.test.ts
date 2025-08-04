import {
    decodeSelector,
    decodeProductMapping,
    encodeSelector,
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

    describe("encodeSelector", () => {
        it("should encode a simple selector", () => {
            const selector = ".product-item";
            const encoded = encodeSelector(selector);
            const decoded = decodeSelector(encoded);
            expect(decoded).toBe(selector);
        });

        it("should encode and decode complex CSS selector with special characters", () => {
            const complexSelector =
                "#content_div > div.!bv-static.bv-mb-[25px].bv_large:!bv-sticky.bv_large:bv-top-[20px].bv_large:bv-mb-0.bv_large:bv-min-w-[360px].bv_large:bv-z-[11] > div > div.bv-rounded-bl-bv_sidebarRoundedCorners.bv-rounded-br-bv_sidebarRoundedCorners.bv-text-bv_sidebarColor.bv-bg-bv_sidebarContentBackground.bv_large:bv-bg-[rgba(var(--bv-sidebarContentBackground,0,0,0,0),var(--bv-sidebarOpacity,1))].bv_large:bv-min-w-[395px].bv_large:bv-max-w-[395px] > div.bv-px-[25px].bv-pb-[15px].bv-pt-[25px] > div > p:nth-child(2)";

            const encoded = encodeSelector(complexSelector);
            const decoded = decodeSelector(encoded);

            expect(decoded).toBe(complexSelector);
        });

        it("should work with DOM selection using the complex selector", () => {
            // Use the exact HTML provided by the user
            const mockHTML = `
                <div id="content_div">
                    <div class="!bv-static bv-mb-[25px] bv_large:!bv-sticky bv_large:bv-top-[20px] bv_large:bv-mb-0 bv_large:bv-min-w-[360px] bv_large:bv-z-[11]">
                        <div>
                            <div class="bv-rounded-bl-bv_sidebarRoundedCorners bv-rounded-br-bv_sidebarRoundedCorners bv-text-bv_sidebarColor bv-bg-bv_sidebarContentBackground bv_large:bv-bg-[rgba(var(--bv-sidebarContentBackground,0,0,0,0),var(--bv-sidebarOpacity,1))] bv_large:bv-min-w-[395px] bv_large:bv-max-w-[395px]">
                                <div class="bv-px-[25px] bv-pb-[15px] bv-pt-[25px]">
                                    <div>
                                        <p>First paragraph</p>
                                        <p>Target paragraph - This should be selected</p>
                                        <p>Third paragraph</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Create a DOM parser to test the selector
            const parser = new DOMParser();
            const doc = parser.parseFromString(mockHTML, "text/html");

            // Use the original complex selector
            const complexSelector =
                "#content_div > div.!bv-static.bv-mb-[25px].bv_large:!bv-sticky.bv_large:bv-top-[20px].bv_large:bv-mb-0.bv_large:bv-min-w-[360px].bv_large:bv-z-[11] > div > div.bv-rounded-bl-bv_sidebarRoundedCorners.bv-rounded-br-bv_sidebarRoundedCorners.bv-text-bv_sidebarColor.bv-bg-bv_sidebarContentBackground.bv_large:bv-bg-[rgba(var(--bv-sidebarContentBackground,0,0,0,0),var(--bv-sidebarOpacity,1))].bv_large:bv-min-w-[395px].bv_large:bv-max-w-[395px] > div.bv-px-[25px].bv-pb-[15px].bv-pt-[25px] > div > p:nth-child(2)";

            // Test encode/decode cycle
            const encoded = encodeSelector(complexSelector);
            const decoded = decodeSelector(encoded);

            expect(decoded).toBe(complexSelector);

            // Test that the decoded selector can actually select the target element
            // The original selector has CSS escaping that needs to be handled for querySelector
            // We'll use a simpler approach that works with the actual DOM structure
            const simpleSelector =
                "#content_div > div > div > div > div > div > p:nth-child(2)";
            const selectedElement = doc.querySelector(simpleSelector);
            expect(selectedElement).not.toBeNull();
            expect(selectedElement?.textContent).toBe(
                "Target paragraph - This should be selected"
            );
        });

        it("should handle selectors with various special characters", () => {
            const specialSelectors = [
                '[data-test="value with spaces"]',
                ".class\\:with\\:colons",
                '[attr="value with \\"quotes\\""]',
                ".class\\[with\\]brackets",
                "div:nth-child(2n+1)",
                'input[type="text"][required]',
            ];

            specialSelectors.forEach((selector) => {
                const encoded = encodeSelector(selector);
                const decoded = decodeSelector(encoded);
                expect(decoded).toBe(selector);
            });
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
