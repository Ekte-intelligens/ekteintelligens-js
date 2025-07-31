import { ProductDetector } from "../src/utils/product-detector";

describe("ProductDetector - All Scenarios", () => {
    describe("Scenario 1: Specific IDs for key-value pairs", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div class="product-item">
                    <div id="product-name-1">Wireless Headphones</div>
                    <div id="product-price-1">$89.99</div>
                    <div id="product-description-1">High-quality wireless headphones</div>
                    <div id="product-category-1">Electronics</div>
                </div>
                <div class="product-item">
                    <div id="product-name-2">Smartphone</div>
                    <div id="product-price-2">$599.99</div>
                    <div id="product-description-2">Latest smartphone model</div>
                    <div id="product-category-2">Electronics</div>
                </div>
            `;
        });

        it("should detect products using specific IDs", () => {
            const productMapping = {
                ".product-item": {
                    fields: {
                        name: "#product-name-1, #product-name-2",
                        price: "#product-price-1, #product-price-2",
                        description:
                            "#product-description-1, #product-description-2",
                        category: "#product-category-1, #product-category-2",
                    },
                },
            };

            const detector = new ProductDetector(productMapping);
            const products = detector.detectProducts();

            expect(products).toHaveLength(2);
            expect(products[0]).toEqual({
                name: "Wireless Headphones",
                price: 89.99,
                description: "High-quality wireless headphones",
                category: "Electronics",
            });
            expect(products[1]).toEqual({
                name: "Smartphone",
                price: 599.99,
                description: "Latest smartphone model",
                category: "Electronics",
            });
        });
    });

    describe("Scenario 2: Specific classes for key-value pairs", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div class="room-item">
                    <div class="room-name">Deluxe Suite</div>
                    <div class="room-price">$299 per night</div>
                    <div class="room-description">Ocean view suite</div>
                    <div class="room-type">Premium</div>
                </div>
                <div class="room-item">
                    <div class="room-name">Standard Room</div>
                    <div class="room-price">$149 per night</div>
                    <div class="room-description">City view room</div>
                    <div class="room-type">Standard</div>
                </div>
                <div class="package-item">
                    <div class="package-name">Weekend Package</div>
                    <div class="package-price">$399</div>
                    <div class="package-duration">2 nights</div>
                    <div class="package-includes">Breakfast included</div>
                </div>
            `;
        });

        it("should detect products using specific classes", () => {
            const productMapping = {
                ".room-item": {
                    fields: {
                        name: ".room-name",
                        price: ".room-price",
                        description: ".room-description",
                        type: ".room-type",
                    },
                },
                ".package-item": {
                    fields: {
                        name: ".package-name",
                        price: ".package-price",
                        duration: ".package-duration",
                        includes: ".package-includes",
                    },
                },
            };

            const detector = new ProductDetector(productMapping);
            const products = detector.detectProducts();

            expect(products).toHaveLength(3);

            // Check room products
            const roomProducts = products.filter(
                (p) => p.name && p.name.includes("Suite")
            );
            expect(roomProducts).toHaveLength(1);
            expect(roomProducts[0]).toEqual({
                name: "Deluxe Suite",
                price: 299,
                description: "Ocean view suite",
                type: "Premium",
            });

            // Check package product
            const packageProduct = products.find(
                (p) => p.name === "Weekend Package"
            );
            expect(packageProduct).toEqual({
                name: "Weekend Package",
                price: 399,
                duration: "2 nights",
                includes: "Breakfast included",
            });
        });
    });

    describe("Scenario 3: Complex selectors for key-value pairs", () => {
        beforeEach(() => {
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
                            <div>
                                <p>Price:</p>
                                <p>$299 per night</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="room-details-2">
                    <div>
                        <div class="bv-flex bv-flex-col">
                            <div>
                                <p>Room Info:</p>
                                <p>Standard Room</p>
                            </div>
                            <div>
                                <p>Check-in:</p>
                                <p>14:00 - 16:00</p>
                            </div>
                            <div>
                                <p>Price:</p>
                                <p>$149 per night</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="product-container">
                    <div class="product-details">
                        <div class="product-header">
                            <h3 class="product-title">Wireless Headphones</h3>
                            <span class="product-sku">SKU: WH-001</span>
                        </div>
                        <div class="product-info">
                            <div class="price-section">
                                <span class="price-label">Price:</span>
                                <span class="price-value">$89.99</span>
                            </div>
                            <div class="description-section">
                                <p class="description-text">High-quality wireless headphones with noise cancellation</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        it("should detect products using complex selectors", () => {
            const productMapping = {
                "#room-details-1, #room-details-2": {
                    fields: {
                        Rominfo:
                            "div > div.bv-flex.bv-flex-col > div:nth-child(1) > p:nth-child(2)",
                        Innsjekking:
                            "div > div.bv-flex.bv-flex-col > div:nth-child(2) > p:nth-child(2)",
                        Pris: "div > div.bv-flex.bv-flex-col > div:nth-child(3) > p:nth-child(2)",
                    },
                },
                ".product-container": {
                    fields: {
                        name: ".product-title",
                        sku: ".product-sku",
                        price: ".price-value",
                        description: ".description-text",
                    },
                },
            };

            const detector = new ProductDetector(productMapping);
            const products = detector.detectProducts();

            expect(products).toHaveLength(3);

            // Check room products
            const deluxeRoom = products.find(
                (p) => p.Rominfo === "Deluxe Suite with Ocean View"
            );
            expect(deluxeRoom).toEqual({
                Rominfo: "Deluxe Suite with Ocean View",
                Innsjekking: "15:00 - 18:00",
                Pris: "$299 per night",
            });

            const standardRoom = products.find(
                (p) => p.Rominfo === "Standard Room"
            );
            expect(standardRoom).toEqual({
                Rominfo: "Standard Room",
                Innsjekking: "14:00 - 16:00",
                Pris: "$149 per night",
            });

            // Check product
            const product = products.find(
                (p) => p.name === "Wireless Headphones"
            );
            expect(product).toEqual({
                name: "Wireless Headphones",
                sku: "SKU: WH-001",
                price: 89.99,
                description:
                    "High-quality wireless headphones with noise cancellation",
            });
        });
    });

    describe("Mixed scenarios with data attributes", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div class="product-item" data-product-id="123" data-product-name="Headphones" data-price="89.99">
                    <span class="product-name">Wireless Headphones</span>
                    <span class="product-price">$89.99</span>
                    <span class="product-category">Electronics</span>
                </div>
                <div class="room-item" data-room-id="room-1">
                    <div class="room-name">Deluxe Suite</div>
                    <div class="room-price">$299</div>
                </div>
            `;
        });

        it("should handle mixed scenarios (data attributes + classes + selectors)", () => {
            const productMapping = {
                ".product-item": {
                    id_selector: "data-product-id",
                    name_selector: ".product-name",
                    price_selector: ".product-price",
                    fields: {
                        category: ".product-category",
                        originalName: "data-product-name",
                    },
                },
                ".room-item": {
                    fields: {
                        id: "data-room-id",
                        name: ".room-name",
                        price: ".room-price",
                    },
                },
            };

            const detector = new ProductDetector(productMapping);
            const products = detector.detectProducts();

            expect(products).toHaveLength(2);

            const product = products.find((p) => p.id === "123");
            expect(product).toEqual({
                id: "123",
                name: "Wireless Headphones",
                price: 89.99,
                category: "Electronics",
                originalName: "Headphones",
            });

            const room = products.find((p) => p.id === "room-1");
            expect(room).toEqual({
                id: "room-1",
                name: "Deluxe Suite",
                price: 299,
            });
        });
    });

    describe("Edge cases and error handling", () => {
        it("should handle missing elements gracefully", () => {
            document.body.innerHTML = `
                <div class="product-item">
                    <div class="product-name">Test Product</div>
                    <!-- Missing price and description -->
                </div>
            `;

            const productMapping = {
                ".product-item": {
                    fields: {
                        name: ".product-name",
                        price: ".product-price",
                        description: ".product-description",
                    },
                },
            };

            const detector = new ProductDetector(productMapping);
            const products = detector.detectProducts();

            expect(products).toHaveLength(1);
            expect(products[0]).toEqual({
                name: "Test Product",
                // price and description should be undefined/not included
            });
        });

        it("should handle empty product mapping", () => {
            document.body.innerHTML = `
                <div class="product-item" data-product-id="123">
                    <span class="product-name">Test Product</span>
                </div>
            `;

            const detector = new ProductDetector({});
            const products = detector.detectProducts();

            expect(products.length).toBeGreaterThan(0);
        });
    });
});
