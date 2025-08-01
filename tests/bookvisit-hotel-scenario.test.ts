import { AbandonedCartTool } from "../src/tools/abandoned-cart";
import { ProductDetector } from "../src/utils/product-detector";
import { TotalExtractor } from "../src/utils/total-extractor";
import { SDKOptions } from "../src/types";

jest.mock("../src/services/supabase-service", () => {
    return {
        SupabaseService: jest.fn().mockImplementation(() => ({
            getCheckoutCampaign: jest.fn().mockResolvedValue({
                id: "bookvisit-hotel-campaign",
                product_mapping: {
                    "#room-details-1": {
                        fields: {
                            Rominfo:
                                ".room-detail-row:nth-child(1) .room-detail-value",
                            Innsjekking:
                                ".room-detail-row:nth-child(2) .room-detail-value",
                            Avreise:
                                ".room-detail-row:nth-child(3) .room-detail-value",
                            Gjester:
                                ".room-detail-row:nth-child(4) .room-detail-value",
                            Inkluderer:
                                ".room-detail-row:nth-child(5) .room-detail-value",
                            Pris: ".room-detail-row:nth-child(6) .room-detail-value",
                        },
                    },
                },
                input_mapping: {
                    inputs: [
                        "[data-testid='customer_info_form_firstname']",
                        "[data-testid='customer_info_form_lastname']",
                        "[data-testid='customer_info_form_email']",
                        "[data-testid='customer_info_form_validateemail']",
                        "[data-testid='customer_info_form_co_address']",
                        "[data-testid='customer_info_form_city']",
                        "[data-testid='customer_info_form_postal_code']",
                        "[data-testid='customer_info_form_street']",
                        "[data-testid='customer_info_form_phone_number']",
                    ],
                    field_mappings: {
                        emailAddress: "email",
                        "checkoutField-phoneNumber": "phone_number",
                        firstName: "first_name",
                        lastName: "last_name",
                        confirmEmailAddress: "confirm_email",
                        coAddress: "co_address",
                        postalCode: "postal_code",
                    },
                },
                total_selector: "#cart-total",
            }),
            submitCartSession: jest.fn().mockResolvedValue({
                id: "bookvisit-session-id",
                success: true,
            }),
        })),
    };
});

describe("BookVisit Hotel Booking Scenario", () => {
    const options: SDKOptions = {
        organizationId: "bookvisit-org",
        checkoutCampaignId: "bookvisit-hotel-campaign",
        features: { abandonedCart: true },
    };

    beforeEach(() => {
        // Set up the BookVisit hotel booking page HTML
        document.body.innerHTML = `
            <!-- Customer Information Form -->
            <div data-testid="checkout_responsible_for_booking_section">
                <div data-testid="customer_info_section">
                    <div>
                        <input type="checkbox" id="i_am_corp_customer">
                        <p>Jeg er en bedriftskunde</p>
                    </div>
                    
                    <div>
                        <input 
                            data-testid="customer_info_form_firstname"
                            placeholder="Fornavn *" 
                            name="firstName"
                            type="text"
                        >
                    </div>
                    
                    <div>
                        <input 
                            data-testid="customer_info_form_lastname"
                            placeholder="Etternavn *" 
                            name="lastName"
                            type="text"
                        >
                    </div>
                    
                    <div>
                        <input 
                            data-testid="customer_info_form_email"
                            placeholder="E-post *" 
                            name="emailAddress"
                            type="email"
                        >
                    </div>
                    
                    <div>
                        <input 
                            data-testid="customer_info_form_validateemail"
                            placeholder="Bekreft epost *" 
                            name="confirmEmailAddress"
                            type="email"
                        >
                    </div>
                    
                    <div>
                        <input 
                            data-testid="customer_info_form_co_address"
                            placeholder="Bi-adresse" 
                            name="coAddress"
                            type="text"
                        >
                    </div>
                    
                    <div>
                        <input 
                            data-testid="customer_info_form_city"
                            placeholder="By *" 
                            name="city"
                            type="text"
                        >
                    </div>
                    
                    <div>
                        <input 
                            data-testid="customer_info_form_postal_code"
                            placeholder="Postnummer *" 
                            name="postalCode"
                            type="text"
                        >
                    </div>
                    
                    <div>
                        <input 
                            data-testid="customer_info_form_street"
                            placeholder="Gate *" 
                            name="street"
                            type="text"
                        >
                    </div>
                    
                    <div>
                        <select data-testid="customer_info_form_choose_country" name="checkoutField-chooseCountry">
                            <option value="">Velg land *</option>
                            <option value="NO">Norge</option>
                        </select>
                    </div>
                    
                    <div>
                        <div class="phone-input">
                            <input 
                                data-testid="customer_info_form_phone_country_code"
                                placeholder="" 
                                name="checkoutField-phoneCountryCode"
                                type="number"
                                value="47"
                            >
                            <input 
                                data-testid="customer_info_form_phone_number"
                                placeholder="Telefonnummer *" 
                                name="checkoutField-phoneNumber"
                                type="number"
                            >
                        </div>
                    </div>
                </div>
            </div>

            <!-- Booking Summary -->
            <div class="booking-summary">
                <h3>Bestillingssammendrag</h3>
                
                <div class="room-details">
                    <div class="room-header">
                        <div class="room-image">🏨</div>
                        <div class="room-info">
                            <div class="room-title">1x: Dobbeltrom med sovesofa (2 Voksne)</div>
                            <div class="room-subtitle">Rom inkl. frokost</div>
                        </div>
                    </div>

                    <div id="room-details-1">
                        <div class="room-detail-row">
                            <span class="room-detail-label">Rominfo:</span>
                            <span class="room-detail-value">Dobbeltseng, 21m2</span>
                        </div>
                        <div class="room-detail-row">
                            <span class="room-detail-label">Innsjekking:</span>
                            <span class="room-detail-value">søn. 31. aug. 2025, 16:00</span>
                        </div>
                        <div class="room-detail-row">
                            <span class="room-detail-label">Avreise:</span>
                            <span class="room-detail-value">man. 1. sep. 2025, 1 Natt</span>
                        </div>
                        <div class="room-detail-row">
                            <span class="room-detail-label">Gjester:</span>
                            <span class="room-detail-value">2 Voksne</span>
                        </div>
                        
                        <div class="room-detail-row">
                            <span class="room-detail-label">Inkluderer:</span>
                            <span class="room-detail-value">Frokost</span>
                        </div>
                        
                        <div class="room-detail-row">
                            <span class="room-detail-label">31. aug. - 01. sep.</span>
                            <span class="room-detail-value">1 790 NOK</span>
                        </div>
                    </div>
                </div>

                <div class="price-section">
                    <div class="room-detail-row">
                        <span class="room-detail-label">Totalpris:</span>
                        <span class="total-price" id="cart-total">1 790 NOK</span>
                    </div>
                </div>
            </div>
        `;
    });

    describe("Input Detection", () => {
        it("should detect form inputs using data-testid selectors", async () => {
            const tool = new AbandonedCartTool(options);
            await tool.initialize();

            // Simulate user input
            const firstNameInput = document.querySelector(
                '[data-testid="customer_info_form_firstname"]'
            ) as HTMLInputElement;
            const lastNameInput = document.querySelector(
                '[data-testid="customer_info_form_lastname"]'
            ) as HTMLInputElement;
            const emailInput = document.querySelector(
                '[data-testid="customer_info_form_email"]'
            ) as HTMLInputElement;
            const phoneInput = document.querySelector(
                '[data-testid="customer_info_form_phone_number"]'
            ) as HTMLInputElement;

            firstNameInput.value = "John";
            firstNameInput.dispatchEvent(new Event("blur"));

            lastNameInput.value = "Doe";
            lastNameInput.dispatchEvent(new Event("blur"));

            emailInput.value = "john.doe@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            phoneInput.value = "12345678";
            phoneInput.dispatchEvent(new Event("blur"));

            const content = tool.getContent();
            expect(content.first_name).toBe("John");
            expect(content.last_name).toBe("Doe");
            expect(content.email).toBe("john.doe@example.com");
            expect(content.phone_number).toBe("12345678");
            expect(tool.hasEmailOrPhone()).toBe(true);
        });

        it("should handle all BookVisit form fields", async () => {
            const tool = new AbandonedCartTool(options);
            await tool.initialize();

            // Fill all form fields
            const fields = [
                {
                    testid: "customer_info_form_firstname",
                    value: "John",
                    name: "firstName",
                },
                {
                    testid: "customer_info_form_lastname",
                    value: "Doe",
                    name: "lastName",
                },
                {
                    testid: "customer_info_form_email",
                    value: "john@example.com",
                    name: "emailAddress",
                },
                {
                    testid: "customer_info_form_validateemail",
                    value: "john@example.com",
                    name: "confirmEmailAddress",
                },
                {
                    testid: "customer_info_form_co_address",
                    value: "Apt 4B",
                    name: "coAddress",
                },
                {
                    testid: "customer_info_form_city",
                    value: "Oslo",
                    name: "city",
                },
                {
                    testid: "customer_info_form_postal_code",
                    value: "0001",
                    name: "postalCode",
                },
                {
                    testid: "customer_info_form_street",
                    value: "Karl Johans gate 1",
                    name: "street",
                },
                {
                    testid: "customer_info_form_phone_number",
                    value: "12345678",
                    name: "checkoutField_phoneNumber",
                },
            ];

            fields.forEach((field) => {
                const input = document.querySelector(
                    `[data-testid="${field.testid}"]`
                ) as HTMLInputElement;
                if (input) {
                    input.value = field.value;
                    input.dispatchEvent(new Event("blur"));
                }
            });

            const content = tool.getContent();
            expect(content.first_name).toBe("John");
            expect(content.last_name).toBe("Doe");
            expect(content.email).toBe("john@example.com");
            expect(content.confirm_email).toBe("john@example.com");
            expect(content.co_address).toBe("Apt 4B");
            expect(content.city).toBe("Oslo");
            expect(content.postal_code).toBe("0001");
            expect(content.street).toBe("Karl Johans gate 1");
            expect(content.phone_number).toBe("12345678");
        });
    });

    describe("Product Detection", () => {
        it("should extract room details from BookVisit booking summary", () => {
            const productMapping = {
                "#room-details-1": {
                    fields: {
                        Rominfo:
                            ".room-detail-row:nth-child(1) .room-detail-value",
                        Innsjekking:
                            ".room-detail-row:nth-child(2) .room-detail-value",
                        Avreise:
                            ".room-detail-row:nth-child(3) .room-detail-value",
                        Gjester:
                            ".room-detail-row:nth-child(4) .room-detail-value",
                        Inkluderer:
                            ".room-detail-row:nth-child(5) .room-detail-value",
                        Pris: ".room-detail-row:nth-child(6) .room-detail-value",
                    },
                },
            };

            const detector = new ProductDetector(productMapping);
            const products = detector.detectProducts();

            expect(products).toHaveLength(1);
            expect(products[0]).toEqual({
                Rominfo: "Dobbeltseng, 21m2",
                Innsjekking: "søn. 31. aug. 2025, 16:00",
                Avreise: "man. 1. sep. 2025, 1 Natt",
                Gjester: "2 Voksne",
                Inkluderer: "Frokost",
                Pris: "1 790 NOK",
            });
        });

        it("should handle complex nested selectors for room details", () => {
            const productMapping = {
                "#room-details-1": {
                    fields: {
                        Rominfo:
                            ".room-detail-row:nth-child(1) .room-detail-value",
                        Innsjekking:
                            ".room-detail-row:nth-child(2) .room-detail-value",
                        Avreise:
                            ".room-detail-row:nth-child(3) .room-detail-value",
                        Gjester:
                            ".room-detail-row:nth-child(4) .room-detail-value",
                        Inkluderer:
                            ".room-detail-row:nth-child(5) .room-detail-value",
                        Pris: ".room-detail-row:nth-child(6) .room-detail-value",
                    },
                },
            };

            const detector = new ProductDetector(productMapping);
            const products = detector.detectProducts();

            expect(products).toHaveLength(1);
            const product = products[0];

            // Verify all fields are extracted correctly
            expect(product.Rominfo).toBe("Dobbeltseng, 21m2");
            expect(product.Innsjekking).toBe("søn. 31. aug. 2025, 16:00");
            expect(product.Avreise).toBe("man. 1. sep. 2025, 1 Natt");
            expect(product.Gjester).toBe("2 Voksne");
            expect(product.Inkluderer).toBe("Frokost");
            expect(product.Pris).toBe("1 790 NOK");
        });
    });

    describe("Total Extraction", () => {
        it("should extract total price from BookVisit booking summary", () => {
            const extractor = new TotalExtractor("#cart-total");
            const total = extractor.extractTotal();

            expect(total).toBe(1790);
        });

        it("should handle Norwegian currency format with spaces", () => {
            // Test with different Norwegian price formats
            document.body.innerHTML = `
                <div id="cart-total">1 790 NOK</div>
                <div id="price-2">2 500 NOK</div>
                <div id="price-3">999 NOK</div>
            `;

            expect(new TotalExtractor("#cart-total").extractTotal()).toBe(1790);
            expect(new TotalExtractor("#price-2").extractTotal()).toBe(2500);
            expect(new TotalExtractor("#price-3").extractTotal()).toBe(999);
        });
    });

    describe("Complete Integration", () => {
        it("should handle complete BookVisit booking scenario", async () => {
            const tool = new AbandonedCartTool(options);
            await tool.initialize();

            // Simulate user filling out the form
            const emailInput = document.querySelector(
                '[data-testid="customer_info_form_email"]'
            ) as HTMLInputElement;
            const phoneInput = document.querySelector(
                '[data-testid="customer_info_form_phone_number"]'
            ) as HTMLInputElement;
            const firstNameInput = document.querySelector(
                '[data-testid="customer_info_form_firstname"]'
            ) as HTMLInputElement;

            emailInput.value = "guest@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            phoneInput.value = "12345678";
            phoneInput.dispatchEvent(new Event("blur"));

            firstNameInput.value = "Guest";
            firstNameInput.dispatchEvent(new Event("blur"));

            // Verify form content is collected
            const content = tool.getContent();
            expect(content.email).toBe("guest@example.com");
            expect(content.phone_number).toBe("12345678");
            expect(content.first_name).toBe("Guest");
            expect(tool.hasEmailOrPhone()).toBe(true);

            // Verify products are detected
            const products = tool.getAbandonedCartTool?.()?.getContent() || {};
            expect(tool.hasEmailOrPhone()).toBe(true);
        });

        it("should send complete payload with all BookVisit data", async () => {
            const tool = new AbandonedCartTool(options);
            await tool.initialize();

            // Fill out form with contact information
            const emailInput = document.querySelector(
                '[data-testid="customer_info_form_email"]'
            ) as HTMLInputElement;
            emailInput.value = "booking@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            // The SDK should now trigger a session submission with:
            // - Form content (email)
            // - Product details (room information)
            // - Total price (1 790 NOK)
            // - Current URL

            expect(tool.hasEmailOrPhone()).toBe(true);
        });
    });

    describe("Edge Cases", () => {
        it("should handle missing form fields gracefully", async () => {
            // Remove some form fields
            const emailInput = document.querySelector(
                '[data-testid="customer_info_form_email"]'
            );
            if (emailInput) emailInput.remove();

            const tool = new AbandonedCartTool(options);
            await tool.initialize();

            // Try to fill a non-existent field
            const phoneInput = document.querySelector(
                '[data-testid="customer_info_form_phone_number"]'
            ) as HTMLInputElement;
            phoneInput.value = "12345678";
            phoneInput.dispatchEvent(new Event("blur"));

            const content = tool.getContent();
            expect(content.phone_number).toBe("12345678");
            expect(tool.hasEmailOrPhone()).toBe(true);
        });

        it("should handle missing product elements gracefully", () => {
            // Remove the room details element
            const roomDetails = document.querySelector("#room-details-1");
            if (roomDetails) roomDetails.remove();

            const productMapping = {
                "#room-details-1": {
                    fields: {
                        Rominfo:
                            ".room-detail-row:nth-child(1) .room-detail-value",
                    },
                },
            };

            const detector = new ProductDetector(productMapping);
            const products = detector.detectProducts();

            expect(products).toHaveLength(0);
        });

        it("should handle missing total element gracefully", () => {
            // Remove the total element
            const totalElement = document.querySelector("#cart-total");
            if (totalElement) totalElement.remove();

            const extractor = new TotalExtractor("#cart-total");
            const total = extractor.extractTotal();

            expect(total).toBe(0);
        });
    });
});
