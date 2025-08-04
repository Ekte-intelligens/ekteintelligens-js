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

    it("should handle over-escaped selectors from database", () => {
        // Set up DOM with the target element
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

        // This is the over-escaped selector as it comes from the database
        const overEscapedSelector =
            "#content_div > div.\\\\!bv-static.bv-mb-\\\\[25px\\\\].bv_large\\\\:\\\\!bv-sticky.bv_large\\\\:bv-top-\\\\[20px\\\\].bv_large\\\\:bv-mb-0.bv_large\\\\:bv-min-w-\\\\[360px\\\\].bv_large\\\\:bv-z-\\\\[11\\\\] > div > div.bv-rounded-bl-bv_sidebarRoundedCorners.bv-rounded-br-bv_sidebarRoundedCorners.bv-text-bv_sidebarColor.bv-bg-bv_sidebarContentBackground.bv_large\\\\:bv-bg-\\\\[rgba\\\\(var\\\\(--bv-sidebarContentBackground\\\\,0\\\\,0\\\\,0\\\\,0\\\\)\\\\,var\\\\(--bv-sidebarOpacity\\\\,1\\\\)\\\\)\\\\].bv_large\\\\:bv-min-w-\\\\[395px\\\\].bv_large\\\\:bv-max-w-\\\\[395px\\\\] > div.bv-px-\\\\[25px\\\\].bv-pb-\\\\[15px\\\\].bv-pt-\\\\[25px\\\\] > div > p:nth-child(2)";

        const extractor = new TotalExtractor(overEscapedSelector);
        const total = extractor.extractTotal();

        // Should successfully extract the total despite the over-escaped selector
        expect(total).toBe(299.99);
    });
});
