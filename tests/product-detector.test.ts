import { ProductDetector } from "../src/utils/product-detector";

describe("ProductDetector", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="product-item" data-product-id="123" data-product-name="Test Product" data-price="29.99" data-quantity="2">
                <span class="product-name">Test Product</span>
                <span class="product-price">$29.99</span>
                <span class="product-quantity">2</span>
            </div>
            <div class="cart-item" data-sku="456" title="Another Product">
                <span class="item-name">Another Product</span>
                <span data-price-amount="19.50">$19.50</span>
            </div>
        `;
    });

    it("should detect products using fields mapping", () => {
        const productMapping = {
            fields: {
                id: "data-product-id",
                name: ".product-name",
                price: ".product-price",
                quantity: ".product-quantity",
            },
        };

        const detector = new ProductDetector(productMapping);
        const products = detector.detectProducts();

        expect(products).toHaveLength(1);
        expect(products[0]).toEqual({
            id: "123",
            name: "Test Product",
            price: 29.99,
            quantity: 2,
        });
    });

    it("should detect products using flexible field mapping", () => {
        document.body.innerHTML = `
            <div id="room-details-1">
                <div>
                    <div class="bv-flex bv-flex-col">
                        <div>
                            <p>Room Info:</p>
                            <p>Deluxe Suite with Ocean View</p>
                        </div>
                        <div>
                            <p>Check-in:</p>
                            <p>15:00 - 18:00</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const productMapping = {
            fields: {
                Rominfo:
                    "#room-details-1 > div > div.bv-flex.bv-flex-col > div:nth-child(1) > p:nth-child(2)",
                Innsjekking:
                    "#room-details-1 > div > div.bv-flex.bv-flex-col > div:nth-child(2) > p:nth-child(2)",
            },
        };

        const detector = new ProductDetector(productMapping);
        const products = detector.detectProducts();

        expect(products).toHaveLength(1);
        expect(products[0]).toEqual({
            Rominfo: "Deluxe Suite with Ocean View",
            Innsjekking: "15:00 - 18:00",
        });
    });

    it("should detect products using common patterns when no mapping provided", () => {
        const detector = new ProductDetector({});
        const products = detector.detectProducts();

        expect(products.length).toBeGreaterThan(0);

        // Should detect the product with data-product-id
        const productWithId = products.find((p) => p.id === "123");
        expect(productWithId).toBeDefined();
        expect(productWithId?.name).toBe("Test Product");
        expect(productWithId?.price).toBe(29.99);
    });

    it("should handle missing product mapping gracefully", () => {
        const detector = new ProductDetector({});
        const products = detector.detectProducts();

        expect(Array.isArray(products)).toBe(true);
    });
});
