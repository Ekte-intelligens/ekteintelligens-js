import { ProductDetector } from "../src/utils/product-detector";

describe("ProductDetector with fields mapping", () => {
    beforeEach(() => {
        // Create a mock structure that matches the selectors in the example
        document.body.innerHTML = `
            <div id="room-details-1">
                <div>
                    <div class="bv-flex bv-flex-col">
                        <div>
                            <p>Room Name</p>
                            <p>Deluxe Suite</p>
                        </div>
                        <div>
                            <p>Check-in</p>
                            <p>2024-01-15</p>
                        </div>
                        <div>
                            <p>Departure</p>
                            <p>2024-01-17</p>
                        </div>
                        <div>
                            <p>Guests</p>
                            <p>2 adults</p>
                        </div>
                        <div>
                            <p>Includes</p>
                            <ul>
                                <li>Breakfast</li>
                                <li>WiFi</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div id="content_div">
                <div class="!bv-static bv-mb-[25px] bv_large:!bv-sticky bv_large:bv-top-[20px] bv_large:bv-mb-0 bv_large:bv-min-w-[360px] bv_large:bv-z-[11]">
                    <div>
                        <div class="bv-rounded-bl-bv_sidebarRoundedCorners bv-rounded-br-bv_sidebarRoundedCorners bv-text-bv_sidebarColor bv-bg-bv_sidebarContentBackground bv_large:bv-bg-[rgba(var(--bv-sidebarContentBackground,0,0,0,0),var(--bv-sidebarOpacity,1))] bv_large:bv-min-w-[395px] bv_large:bv-max-w-[395px]">
                            <div class="bv-flex bv-flex-col bv-gap-[30px]">
                                <div>
                                    <section>
                                        <div>
                                            <div>
                                                <section>
                                                    <div>
                                                        <div class="bv-flex bv-items-center bv-px-0 bv-py-[4px] bv-justify-between">
                                                            <div class="bv-flex-1 bv-text-right bv-flex bv-gap-[5px]">
                                                                <div>
                                                                    <span>NOK 1,500</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </section>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    it("should detect products using the new fields mapping structure", () => {
        const productMapping = {
            fields: {
                name: "#room-details-1 > div > div.bv-flex.bv-flex-col > div:nth-child(1) > p:nth-child(2)",
                price: "#content_div span",
                Avreise:
                    "#room-details-1 > div > div.bv-flex.bv-flex-col > div:nth-child(3) > p:nth-child(2)",
                Gjester:
                    "#room-details-1 > div > div.bv-flex.bv-flex-col > div:nth-child(4) > p:nth-child(2)",
                Inkluderer:
                    "#room-details-1 > div > div.bv-flex.bv-flex-col > div:nth-child(5) > ul",
                Innsjekking:
                    "#room-details-1 > div > div.bv-flex.bv-flex-col > div:nth-child(2) > p:nth-child(2)",
            },
        };

        const detector = new ProductDetector(productMapping);
        const products = detector.detectProducts();

        expect(products).toHaveLength(1);
        expect(products[0]).toEqual({
            name: "Deluxe Suite",
            price: 1500,
            Avreise: "2024-01-17",
            Gjester: "2 adults",
            Inkluderer: "Breakfast\n                                WiFi",
            Innsjekking: "2024-01-15",
        });
    });

    it("should handle empty fields mapping", () => {
        const productMapping = {
            fields: {},
        };

        const detector = new ProductDetector(productMapping);
        const products = detector.detectProducts();

        expect(products).toHaveLength(0);
    });

    it("should handle null/undefined product mapping", () => {
        const detector = new ProductDetector(null as any);
        const products = detector.detectProducts();

        expect(products).toHaveLength(0);
    });
});
