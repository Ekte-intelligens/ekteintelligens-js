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
                fields: {
                    name: "#product-name-1, #product-name-2",
                    price: "#product-price-1, #product-price-2",
                    description:
                        "#product-description-1, #product-description-2",
                    category: "#product-category-1, #product-category-2",
                },
            };

            const detector = new ProductDetector(productMapping);
            const products = detector.detectProducts();

            expect(products).toHaveLength(1);
            expect(products[0]).toEqual({
                name: "Wireless Headphones",
                price: 89.99,
                description: "High-quality wireless headphones",
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
                fields: {
                    name: ".room-name, .package-name",
                    price: ".room-price, .package-price",
                    description: ".room-description",
                    type: ".room-type",
                    duration: ".package-duration",
                    includes: ".package-includes",
                },
            };

            const detector = new ProductDetector(productMapping);
            const products = detector.detectProducts();

            expect(products).toHaveLength(1);
            expect(products[0]).toEqual({
                name: "Deluxe Suite",
                price: 299,
                description: "Ocean view suite",
                type: "Premium",
                duration: "2 nights",
                includes: "Breakfast included",
            });
        });
    });

    describe("Scenario 3: Complex selectors for key-value pairs", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div class="hotel-booking">
                    <div class="room-details">
                        <div class="room-info">
                            <h3 class="room-title">Deluxe Suite</h3>
                            <div class="room-price-info">
                                <span class="price-amount">$299</span>
                                <span class="price-period">per night</span>
                            </div>
                            <div class="room-features">
                                <span class="feature">Ocean View</span>
                                <span class="feature">Balcony</span>
                                <span class="feature">King Bed</span>
                            </div>
                        </div>
                    </div>
                    <div class="room-details">
                        <div class="room-info">
                            <h3 class="room-title">Standard Room</h3>
                            <div class="room-price-info">
                                <span class="price-amount">$149</span>
                                <span class="price-period">per night</span>
                            </div>
                            <div class="room-features">
                                <span class="feature">City View</span>
                                <span class="feature">Queen Bed</span>
                            </div>
                        </div>
                    </div>
                    <div class="package-details">
                        <div class="package-info">
                            <h3 class="package-title">Weekend Package</h3>
                            <div class="package-price-info">
                                <span class="price-amount">$399</span>
                                <span class="package-duration">2 nights</span>
                            </div>
                            <div class="package-includes">
                                <span class="include">Breakfast</span>
                                <span class="include">WiFi</span>
                                <span class="include">Parking</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        it("should detect products using complex selectors", () => {
            const productMapping = {
                fields: {
                    name: ".room-title, .package-title",
                    price: ".price-amount",
                    features: ".room-features .feature",
                    includes: ".package-includes .include",
                },
            };

            const detector = new ProductDetector(productMapping);
            const products = detector.detectProducts();

            expect(products).toHaveLength(1);
            expect(products[0]).toEqual({
                name: "Deluxe Suite",
                price: 299,
                features: "Ocean View",
                includes: "Breakfast",
            });
        });
    });

    describe("Mixed scenarios with data attributes", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div class="product-item" data-product-id="123" data-category="Electronics">
                    <div class="product-name">Wireless Headphones</div>
                    <div class="product-price">$89.99</div>
                    <div class="product-description">High-quality wireless headphones</div>
                </div>
                <div class="service-item" data-service-id="456" data-type="Premium">
                    <div class="service-name">VIP Package</div>
                    <div class="service-price">$199.99</div>
                    <div class="service-description">Exclusive VIP experience</div>
                </div>
            `;
        });

        it("should handle mixed scenarios (data attributes + classes + selectors)", () => {
            const productMapping = {
                fields: {
                    id: "data-product-id",
                    name: ".product-name",
                    price: ".product-price",
                    description: ".product-description",
                    category: "data-category",
                },
            };

            const detector = new ProductDetector(productMapping);
            const products = detector.detectProducts();

            expect(products).toHaveLength(1);
            expect(products[0]).toEqual({
                id: "123",
                name: "Wireless Headphones",
                price: 89.99,
                description: "High-quality wireless headphones",
                category: "Electronics",
            });
        });
    });

    describe("Edge cases and error handling", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div class="product-item">
                    <div class="product-name">Test Product</div>
                    <!-- Missing price and description elements -->
                </div>
            `;
        });

        it("should handle missing elements gracefully", () => {
            const productMapping = {
                fields: {
                    name: ".product-name",
                    price: ".product-price",
                    description: ".product-description",
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
    });
});
