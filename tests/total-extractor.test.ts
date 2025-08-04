import { TotalExtractor } from "../src/utils/total-extractor";

describe("TotalExtractor", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="cart-total">$299.99</div>
            <span class="cart-total">$149.50</span>
            <div class="checkout-summary">
                <div class="total-amount">$89.99</div>
            </div>
            <div data-cart-total="$199.99">$199.99</div>
            <div class="cart-container">
                <div class="summary">
                    <div class="total-value">$399.99</div>
                </div>
            </div>
        `;
    });

    it("should extract total using ID selector", () => {
        const extractor = new TotalExtractor("#cart-total");
        const total = extractor.extractTotal();
        expect(total).toBe(299.99);
    });

    it("should extract total using class selector", () => {
        const extractor = new TotalExtractor(".cart-total");
        const total = extractor.extractTotal();
        expect(total).toBe(149.5);
    });

    it("should extract total using complex selector", () => {
        const extractor = new TotalExtractor(".checkout-summary .total-amount");
        const total = extractor.extractTotal();
        expect(total).toBe(89.99);
    });

    it("should extract total using data attribute selector", () => {
        const extractor = new TotalExtractor("[data-cart-total]");
        const total = extractor.extractTotal();
        expect(total).toBe(199.99);
    });

    it("should extract total using nested selector", () => {
        const extractor = new TotalExtractor(
            ".cart-container .summary .total-value"
        );
        const total = extractor.extractTotal();
        expect(total).toBe(399.99);
    });

    it("should return 0 when no selector is provided", () => {
        const extractor = new TotalExtractor();
        const total = extractor.extractTotal();
        expect(total).toBe(0);
    });

    it("should return 0 when selector is not found", () => {
        const extractor = new TotalExtractor("#non-existent");
        const total = extractor.extractTotal();
        expect(total).toBe(0);
    });

    it("should handle empty text content", () => {
        document.body.innerHTML = '<div id="empty-total"></div>';
        const extractor = new TotalExtractor("#empty-total");
        const total = extractor.extractTotal();
        expect(total).toBe(0);
    });

    it("should handle invalid number formats", () => {
        document.body.innerHTML = '<div id="invalid-total">Invalid</div>';
        const extractor = new TotalExtractor("#invalid-total");
        const total = extractor.extractTotal();
        expect(total).toBe(0);
    });

    it("should handle different currency formats", () => {
        document.body.innerHTML = `
            <div id="usd">$1,234.56</div>
            <div id="eur">€999,99</div>
            <div id="simple">123.45</div>
        `;

        expect(new TotalExtractor("#usd").extractTotal()).toBe(1234.56);
        expect(new TotalExtractor("#eur").extractTotal()).toBe(999.99);
        expect(new TotalExtractor("#simple").extractTotal()).toBe(123.45);
    });

    it("should check if total selector is available", () => {
        const extractor1 = new TotalExtractor("#cart-total");
        const extractor2 = new TotalExtractor();

        expect(extractor1.hasTotalSelector()).toBe(true);
        expect(extractor2.hasTotalSelector()).toBe(false);
    });

    it("should handle encoded selectors correctly", () => {
        // Test with an encoded selector
        const originalSelector = "#cart-total";
        const encodedSelector = btoa(encodeURIComponent(originalSelector));

        const extractor = new TotalExtractor(encodedSelector);
        const total = extractor.extractTotal();

        expect(total).toBe(299.99);
        expect(extractor.hasTotalSelector()).toBe(true);
    });

    it("should handle complex encoded selectors", () => {
        // Test with a complex encoded selector
        const originalSelector = ".checkout-summary .total-amount";
        const encodedSelector = btoa(encodeURIComponent(originalSelector));

        const extractor = new TotalExtractor(encodedSelector);
        const total = extractor.extractTotal();

        expect(total).toBe(89.99);
    });

    it("should handle encoded selectors with special characters", () => {
        // Test with a selector containing special characters
        const originalSelector = '[data-cart-total="$199.99"]';
        const encodedSelector = btoa(encodeURIComponent(originalSelector));

        const extractor = new TotalExtractor(encodedSelector);
        const total = extractor.extractTotal();

        expect(total).toBe(199.99);
    });

    it("should handle the complex encoded selector from the error", () => {
        // This is the exact encoded selector from the error
        const encodedSelector =
            "JTIzY29udGVudF9kaXYlMjAlM0UlMjBkaXYuIWJ2LXN0YXRpYy5idi1tYi0lNUIyNXB4JTVELmJ2X2xhcmdlJTNBIWJ2LXN0aWNreS5idl9sYXJnZSUzQWJ2LXRvcC0lNUIyMHB4JTVELmJ2X2xhcmdlJTNBYnYtbWItMC5idl9sYXJnZSUzQWJ2LW1pbi13LSU1QjM2MHB4JTVELmJ2X2xhcmdlJTNBYnYtei0lNUIxMSU1RCUyMCUzRSUyMGRpdiUyMCUzRSUyMGRpdi5idi1yb3VuZGVkLWJsLWJ2X3NpZGViYXJSb3VuZGVkQ29ybmVycy5idi1yb3VuZGVkLWJyLWJ2X3NpZGViYXJSb3VuZGVkQ29ybmVycy5idi10ZXh0LWJ2X3NpZGViYXJDb2xvci5idi1iZy1idl9zaWRlYmFyQ29udGVudEJhY2tncm91bmQuYnZfbGFyZ2UlM0Fidi1iZy0lNUJyZ2JhKHZhcigtLWJ2LXNpZGViYXJDb250ZW50QmFja2dyb3VuZCUyQzAlMkMwJTJDMCUyQzApJTJDdmFyKC0tYnYtc2lkZWJhck9wYWNpdHklMkMxKSklNUQuYnZfbGFyZ2UlM0Fidi1taW4tdy0lNUIzOTVweCU1RC5idl9sYXJnZSUzQWJ2LW1heC13LSU1QjM5NXB4JTVEJTIwJTNFJTIwZGl2LmJ2LXB4LSU1QjI1cHglNUQuYnYtcGItJTVCMTVweCU1RC5idi1wdC0lNUIyNXB4JTVEJTIwJTNFJTIwZGl2JTIwJTNFJTIwcCUzQW50aC1jaGlsZCgyKQ==";

        // Set up the DOM structure that matches this selector
        document.body.innerHTML = `
            <div id="content_div">
                <div class="!bv-static bv-mb-[25px] bv_large:!bv-sticky bv_large:bv-top-[20px] bv_large:bv-mb-0 bv_large:bv-min-w-[360px] bv_large:bv-z-[11]">
                    <div>
                        <div class="bv-rounded-bl-bv_sidebarRoundedCorners bv-rounded-br-bv_sidebarRoundedCorners bv-text-bv_sidebarColor bv-bg-bv_sidebarContentBackground bv_large:bv-bg-[rgba(var(--bv-sidebarContentBackground,0,0,0,0),var(--bv-sidebarOpacity,1))] bv_large:bv-min-w-[395px] bv_large:bv-max-w-[395px]">
                            <div class="bv-px-[25px] bv-pb-[15px] bv-pt-[25px]">
                                <div>
                                    <p>First paragraph</p>
                                    <p>$299.99</p>
                                    <p>Third paragraph</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const extractor = new TotalExtractor(encodedSelector);
        const total = extractor.extractTotal();

        // The selector should work and extract the total
        expect(total).toBe(299.99);
    });
});
