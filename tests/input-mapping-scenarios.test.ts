import { InputDetector } from "../src/utils/input-detector";
import { InputMapping } from "../src/types";

describe("Input Mapping Scenarios", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <form id="checkout-form">
                <input type="text" name="firstName" id="first-name" />
                <input type="text" name="lastName" id="last-name" />
                <input type="email" name="emailAddress" id="email" />
                <input type="tel" name="checkoutField-phoneNumber" id="phone" />
                <input type="text" name="address" id="address" />
            </form>
            
            <div id="other-section">
                <input type="text" name="otherField" id="other-field" />
                <input type="email" name="contactEmail" id="contact-email" />
            </div>
        `;
    });

    describe("Scenario 1: Field mapping for email/phone detection", () => {
        it("should map field names and detect email/phone correctly", () => {
            const inputMapping: InputMapping = {
                inputs: ["#email", "#phone", "#first-name", "#last-name"],
                field_mappings: {
                    emailAddress: "email",
                    "checkoutField-phoneNumber": "phone_number",
                    firstName: "first_name",
                    lastName: "last_name",
                },
            };

            const detector = new InputDetector(inputMapping);
            let capturedContent: Record<string, any> = {};
            let sessionTriggered = false;

            detector.setOnContentUpdate((content, sessionId) => {
                capturedContent = content;
                sessionTriggered = true;
            });

            detector.startListening();

            // Fill email field
            const emailInput = document.getElementById(
                "email"
            ) as HTMLInputElement;
            emailInput.value = "test@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            // Should trigger session because email is detected
            expect(sessionTriggered).toBe(true);
            expect(capturedContent.email).toBe("test@example.com");
            expect(detector.hasEmailOrPhoneNumber()).toBe(true);

            // Fill phone field
            const phoneInput = document.getElementById(
                "phone"
            ) as HTMLInputElement;
            phoneInput.value = "12345678";
            phoneInput.dispatchEvent(new Event("blur"));

            // Should still have session triggered
            expect(capturedContent.phone_number).toBe("12345678");
            expect(detector.hasEmailOrPhoneNumber()).toBe(true);

            // Fill other fields
            const firstNameInput = document.getElementById(
                "first-name"
            ) as HTMLInputElement;
            firstNameInput.value = "John";
            firstNameInput.dispatchEvent(new Event("blur"));

            expect(capturedContent.first_name).toBe("John");
        });

        it("should detect email/phone without field mappings", () => {
            const inputMapping: InputMapping = {
                inputs: ["#email", "#phone"],
            };

            const detector = new InputDetector(inputMapping);
            let sessionTriggered = false;

            detector.setOnContentUpdate(() => {
                sessionTriggered = true;
            });

            detector.startListening();

            // Fill email field
            const emailInput = document.getElementById(
                "email"
            ) as HTMLInputElement;
            emailInput.value = "test@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            expect(sessionTriggered).toBe(true);
            expect(detector.hasEmailOrPhoneNumber()).toBe(true);
        });
    });

    describe("Scenario 2: Collecting all input fields on page", () => {
        it("should collect all inputs when input_mapping is null", () => {
            const detector = new InputDetector(null);
            let capturedContent: Record<string, any> = {};

            detector.setOnContentUpdate((content) => {
                capturedContent = content;
            });

            detector.startListening();

            // Fill all inputs
            const inputs = document.querySelectorAll("input");
            inputs.forEach((input, index) => {
                (input as HTMLInputElement).value = `value${index}`;
                input.dispatchEvent(new Event("blur"));
            });

            // The callback is only triggered when email/phone is detected
            // So we need to fill an email field to trigger the callback
            const emailInput = document.getElementById(
                "email"
            ) as HTMLInputElement;
            emailInput.value = "test@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            // Should have collected all input values
            expect(capturedContent.firstName).toBe("value0");
            expect(capturedContent.lastName).toBe("value1");
            expect(capturedContent.emailAddress).toBe("test@example.com");
            expect(capturedContent["checkoutField-phoneNumber"]).toBe("value3");
            expect(capturedContent.address).toBe("value4");
            expect(capturedContent.otherField).toBe("value5");
            expect(capturedContent.contactEmail).toBe("value6");
        });
    });

    describe("Scenario 3: Collecting all input fields of form/parent", () => {
        it("should collect all inputs within specified form", () => {
            const inputMapping: InputMapping = {
                form_selector: "#checkout-form",
            };

            const detector = new InputDetector(inputMapping);
            let capturedContent: Record<string, any> = {};

            detector.setOnContentUpdate((content) => {
                capturedContent = content;
            });

            detector.startListening();

            // Fill form inputs
            const formInputs = document
                .querySelector("#checkout-form")
                ?.querySelectorAll("input");
            formInputs?.forEach((input, index) => {
                (input as HTMLInputElement).value = `formValue${index}`;
                input.dispatchEvent(new Event("blur"));
            });

            // The callback is only triggered when email/phone is detected
            // So we need to fill an email field to trigger the callback
            const emailInput = document.getElementById(
                "email"
            ) as HTMLInputElement;
            emailInput.value = "test@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            // Should have collected only form input values
            expect(capturedContent.firstName).toBe("formValue0");
            expect(capturedContent.lastName).toBe("formValue1");
            expect(capturedContent.emailAddress).toBe("test@example.com");
            expect(capturedContent["checkoutField-phoneNumber"]).toBe(
                "formValue3"
            );
            expect(capturedContent.address).toBe("formValue4");

            // Should NOT have collected inputs outside the form
            expect(capturedContent.otherField).toBeUndefined();
            expect(capturedContent.contactEmail).toBeUndefined();
        });

        it("should collect all inputs within specified parent container", () => {
            const inputMapping: InputMapping = {
                form_selector: "#other-section",
            };

            const detector = new InputDetector(inputMapping);
            let capturedContent: Record<string, any> = {};

            detector.setOnContentUpdate((content) => {
                capturedContent = content;
            });

            detector.startListening();

            // Fill section inputs
            const sectionInputs = document
                .querySelector("#other-section")
                ?.querySelectorAll("input");
            sectionInputs?.forEach((input, index) => {
                (input as HTMLInputElement).value = `sectionValue${index}`;
                input.dispatchEvent(new Event("blur"));
            });

            // The callback is only triggered when email/phone is detected
            // So we need to fill an email field to trigger the callback
            const contactEmailInput = document.getElementById(
                "contact-email"
            ) as HTMLInputElement;
            contactEmailInput.value = "test@example.com";
            contactEmailInput.dispatchEvent(new Event("blur"));

            // Should have collected only section input values
            expect(capturedContent.otherField).toBe("sectionValue0");
            expect(capturedContent.contactEmail).toBe("test@example.com");

            // Should NOT have collected inputs outside the section
            expect(capturedContent.firstName).toBeUndefined();
            expect(capturedContent.lastName).toBeUndefined();
        });
    });

    describe("Scenario 4: Collecting specific input fields only", () => {
        it("should collect only specified inputs", () => {
            const inputMapping: InputMapping = {
                inputs: ["#email", "#phone", "#first-name"],
            };

            const detector = new InputDetector(inputMapping);
            let capturedContent: Record<string, any> = {};

            detector.setOnContentUpdate((content) => {
                capturedContent = content;
            });

            detector.startListening();

            // Fill all inputs on page
            const allInputs = document.querySelectorAll("input");
            allInputs.forEach((input, index) => {
                (input as HTMLInputElement).value = `allValue${index}`;
                input.dispatchEvent(new Event("blur"));
            });

            // The callback is only triggered when email/phone is detected
            // So we need to fill an email field to trigger the callback
            const emailInput = document.getElementById(
                "email"
            ) as HTMLInputElement;
            emailInput.value = "test@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            // Should have collected only specified input values
            expect(capturedContent.emailAddress).toBe("test@example.com"); // #email
            expect(capturedContent["checkoutField-phoneNumber"]).toBe(
                "allValue3"
            ); // #phone
            expect(capturedContent.firstName).toBe("allValue0"); // #first-name

            // Should NOT have collected unspecified inputs
            expect(capturedContent.lastName).toBeUndefined();
            expect(capturedContent.address).toBeUndefined();
            expect(capturedContent.otherField).toBeUndefined();
            expect(capturedContent.contactEmail).toBeUndefined();
        });

        it("should handle specific inputs with field mappings", () => {
            const inputMapping: InputMapping = {
                inputs: ["#email", "#phone", "#first-name"],
                field_mappings: {
                    emailAddress: "email",
                    "checkoutField-phoneNumber": "phone_number",
                    firstName: "first_name",
                },
            };

            const detector = new InputDetector(inputMapping);
            let capturedContent: Record<string, any> = {};

            detector.setOnContentUpdate((content) => {
                capturedContent = content;
            });

            detector.startListening();

            // Fill specified inputs
            const emailInput = document.getElementById(
                "email"
            ) as HTMLInputElement;
            const phoneInput = document.getElementById(
                "phone"
            ) as HTMLInputElement;
            const firstNameInput = document.getElementById(
                "first-name"
            ) as HTMLInputElement;

            emailInput.value = "test@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            phoneInput.value = "12345678";
            phoneInput.dispatchEvent(new Event("blur"));

            firstNameInput.value = "John";
            firstNameInput.dispatchEvent(new Event("blur"));

            // Should have collected mapped field names
            expect(capturedContent.email).toBe("test@example.com");
            expect(capturedContent.phone_number).toBe("12345678");
            expect(capturedContent.first_name).toBe("John");
        });
    });

    describe("Edge Cases", () => {
        it("should handle missing form selector gracefully", () => {
            const inputMapping: InputMapping = {
                form_selector: "#non-existent-form",
            };

            const detector = new InputDetector(inputMapping);
            let capturedContent: Record<string, any> = {};

            detector.setOnContentUpdate((content) => {
                capturedContent = content;
            });

            detector.startListening();

            // Fill an input
            const emailInput = document.getElementById(
                "email"
            ) as HTMLInputElement;
            emailInput.value = "test@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            // Should fallback to all inputs
            expect(capturedContent.emailAddress).toBe("test@example.com");
        });

        it("should handle missing specific inputs gracefully", () => {
            const inputMapping: InputMapping = {
                inputs: ["#non-existent", "#email", "#another-non-existent"],
            };

            const detector = new InputDetector(inputMapping);
            let capturedContent: Record<string, any> = {};

            detector.setOnContentUpdate((content) => {
                capturedContent = content;
            });

            detector.startListening();

            // Fill an existing input
            const emailInput = document.getElementById(
                "email"
            ) as HTMLInputElement;
            emailInput.value = "test@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            // Should only collect existing inputs
            expect(capturedContent.emailAddress).toBe("test@example.com");
            expect(capturedContent["non-existent"]).toBeUndefined();
            expect(capturedContent["another-non-existent"]).toBeUndefined();
        });

        it("should handle empty input mapping gracefully", () => {
            const inputMapping: InputMapping = {
                inputs: [],
            };

            const detector = new InputDetector(inputMapping);
            let capturedContent: Record<string, any> = {};

            detector.setOnContentUpdate((content) => {
                capturedContent = content;
            });

            detector.startListening();

            // Fill an input
            const emailInput = document.getElementById(
                "email"
            ) as HTMLInputElement;
            emailInput.value = "test@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            // Should fallback to all inputs
            expect(capturedContent.emailAddress).toBe("test@example.com");
        });
    });
});
