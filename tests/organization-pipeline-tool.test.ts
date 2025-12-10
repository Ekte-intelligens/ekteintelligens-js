import { OrganizationPipelineTool } from "../src/tools/organization-pipeline";
import { SDKOptions } from "../src/types";

jest.mock("../src/services/supabase-service", () => {
    return {
        SupabaseService: jest.fn().mockImplementation(() => ({
            getPipelineCampaign: jest.fn(),
            runOrganizationPipeline: jest.fn().mockResolvedValue(true),
        })),
    };
});

describe("OrganizationPipelineTool", () => {
    const mockSupabaseService = require("../src/services/supabase-service");

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Selector Types", () => {
        it("should handle 'name' selector type", async () => {
            mockSupabaseService.SupabaseService.mockImplementation(() => ({
                getPipelineCampaign: jest.fn().mockResolvedValue({
                    id: "test-pipeline-id",
                    input_mapping: {
                        email: {
                            type: "input",
                            selector_type: "name",
                            selector_value: "email",
                            default_value: "",
                        },
                    },
                    button_mapping: {
                        selector_type: "name",
                        selector_value: "submit_button",
                    },
                    additional_properties: {
                        form_id: 79,
                        from_element: "signup_form",
                        ainternal_run_pipeline: true,
                    },
                    organization_id: "test-org-id",
                }),
                runOrganizationPipeline: jest.fn().mockResolvedValue(true),
            }));

            document.body.innerHTML = `
                <form>
                    <input type="email" name="email" />
                    <button type="button" name="submit_button">Submit</button>
                </form>
            `;

            const options: SDKOptions = {
                organizationId: "test-org-id",
                checkoutCampaignId: "test-checkout-id",
                pipelineCampaignId: "test-pipeline-id",
                features: { organizationPipeline: true },
            };

            const tool = new OrganizationPipelineTool(options);
            await tool.initialize();

            const emailInput = document.querySelector(
                'input[name="email"]'
            ) as HTMLInputElement;
            emailInput.value = "test@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            const formData = tool.getFormData();
            expect(formData.email).toBe("test@example.com");
        });

        it("should handle 'id' selector type", async () => {
            mockSupabaseService.SupabaseService.mockImplementation(() => ({
                getPipelineCampaign: jest.fn().mockResolvedValue({
                    id: "test-pipeline-id",
                    input_mapping: {
                        email: {
                            type: "input",
                            selector_type: "id",
                            selector_value: "emailAddress",
                            default_value: "",
                        },
                    },
                    button_mapping: {
                        selector_type: "id",
                        selector_value: "submit_btn",
                    },
                    additional_properties: {},
                    organization_id: "test-org-id",
                }),
                runOrganizationPipeline: jest.fn().mockResolvedValue(true),
            }));

            document.body.innerHTML = `
                <form>
                    <input type="email" id="emailAddress" />
                    <button type="button" id="submit_btn">Submit</button>
                </form>
            `;

            const options: SDKOptions = {
                organizationId: "test-org-id",
                checkoutCampaignId: "test-checkout-id",
                pipelineCampaignId: "test-pipeline-id",
                features: { organizationPipeline: true },
            };

            const tool = new OrganizationPipelineTool(options);
            await tool.initialize();

            const emailInput = document.getElementById(
                "emailAddress"
            ) as HTMLInputElement;
            emailInput.value = "user@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            const formData = tool.getFormData();
            expect(formData.email).toBe("user@example.com");
        });

        it("should handle 'querySelector' selector type with escaped backslashes", async () => {
            mockSupabaseService.SupabaseService.mockImplementation(() => ({
                getPipelineCampaign: jest.fn().mockResolvedValue({
                    id: "test-pipeline-id",
                    input_mapping: {
                        email: {
                            type: "input",
                            selector_type: "name",
                            selector_value: "email",
                            default_value: "",
                        },
                    },
                    button_mapping: {
                        selector_type: "querySelector",
                        selector_value:
                            "body > div.bv-ibe > div.styleThemeContainer.bv-group.bv-contents > div > main > form > div.bv-flex.bv-justify-between.bv-gap-\\\\[20px\\\\] > button",
                    },
                    additional_properties: {
                        form_id: 79,
                        from_element: "signup_form",
                        ainternal_run_pipeline: true,
                    },
                    organization_id: "test-org-id",
                }),
                runOrganizationPipeline: jest.fn().mockResolvedValue(true),
            }));

            document.body.innerHTML = `
                <div class="bv-ibe">
                    <div class="styleThemeContainer bv-group bv-contents">
                        <div>
                            <main>
                                <form>
                                    <input type="email" name="email" />
                                    <div class="bv-flex bv-justify-between bv-gap-[20px]">
                                        <button type="button">Submit</button>
                                    </div>
                                </form>
                            </main>
                        </div>
                    </div>
                </div>
            `;

            const options: SDKOptions = {
                organizationId: "test-org-id",
                checkoutCampaignId: "test-checkout-id",
                pipelineCampaignId: "test-pipeline-id",
                features: { organizationPipeline: true },
            };

            const tool = new OrganizationPipelineTool(options);
            const initialized = await tool.initialize();
            expect(initialized).toBe(true);
        });

        it("should handle 'class' selector type", async () => {
            mockSupabaseService.SupabaseService.mockImplementation(() => ({
                getPipelineCampaign: jest.fn().mockResolvedValue({
                    id: "test-pipeline-id",
                    input_mapping: {
                        email: {
                            type: "input",
                            selector_type: "class",
                            selector_value: "email-input",
                            default_value: "",
                        },
                    },
                    button_mapping: {
                        selector_type: "class",
                        selector_value: "submit-button",
                    },
                    additional_properties: {},
                    organization_id: "test-org-id",
                }),
                runOrganizationPipeline: jest.fn().mockResolvedValue(true),
            }));

            document.body.innerHTML = `
                <form>
                    <input type="email" class="email-input" />
                    <button type="button" class="submit-button">Submit</button>
                </form>
            `;

            const options: SDKOptions = {
                organizationId: "test-org-id",
                checkoutCampaignId: "test-checkout-id",
                pipelineCampaignId: "test-pipeline-id",
                features: { organizationPipeline: true },
            };

            const tool = new OrganizationPipelineTool(options);
            await tool.initialize();

            const emailInput = document.querySelector(
                ".email-input"
            ) as HTMLInputElement;
            emailInput.value = "class@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            const formData = tool.getFormData();
            expect(formData.email).toBe("class@example.com");
        });
    });

    describe("Checkbox Input Functionality", () => {
        it("should set value to true when checkbox is checked with matching true_value", async () => {
            mockSupabaseService.SupabaseService.mockImplementation(() => ({
                getPipelineCampaign: jest.fn().mockResolvedValue({
                    id: "test-pipeline-id",
                    input_mapping: {
                        email: {
                            type: "input",
                            selector_type: "name",
                            selector_value: "emailAddress",
                            default_value: "",
                        },
                        ainternal_run_pipeline: {
                            type: "checkbox",
                            selector_type: "id",
                            selector_value: "newletter_cb",
                            true_value: "on",
                        },
                    },
                    button_mapping: {
                        selector_type: "name",
                        selector_value: "confirm_booking_button",
                    },
                    additional_properties: {
                        status: "Booket",
                        form_id: 79,
                        from_element: "booking_form",
                    },
                    organization_id: "test-org-id",
                }),
                runOrganizationPipeline: jest.fn().mockResolvedValue(true),
            }));

            document.body.innerHTML = `
                <form>
                    <input type="email" name="emailAddress" />
                    <input type="checkbox" id="newletter_cb" value="on" />
                    <button type="button" name="confirm_booking_button">Confirm Booking</button>
                </form>
            `;

            const options: SDKOptions = {
                organizationId: "test-org-id",
                checkoutCampaignId: "test-checkout-id",
                pipelineCampaignId: "test-pipeline-id",
                features: { organizationPipeline: true },
            };

            const tool = new OrganizationPipelineTool(options);
            await tool.initialize();

            // Initially checkbox is unchecked, so value should be false
            let formData = tool.getFormData();
            expect(formData.ainternal_run_pipeline).toBe(false);

            // Check the checkbox
            const checkbox = document.getElementById(
                "newletter_cb"
            ) as HTMLInputElement;
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event("change"));

            // Value should be true since checkbox is checked and value is "on"
            formData = tool.getFormData();
            expect(formData.ainternal_run_pipeline).toBe(true);

            // Uncheck the checkbox
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event("change"));

            // Value should be false again
            formData = tool.getFormData();
            expect(formData.ainternal_run_pipeline).toBe(false);
        });

        it("should set value to false when checkbox value does not match true_value", async () => {
            mockSupabaseService.SupabaseService.mockImplementation(() => ({
                getPipelineCampaign: jest.fn().mockResolvedValue({
                    id: "test-pipeline-id",
                    input_mapping: {
                        ainternal_run_pipeline: {
                            type: "checkbox",
                            selector_type: "id",
                            selector_value: "newletter_cb",
                            true_value: "on",
                        },
                    },
                    button_mapping: {
                        selector_type: "name",
                        selector_value: "submit_button",
                    },
                    additional_properties: {},
                    organization_id: "test-org-id",
                }),
                runOrganizationPipeline: jest.fn().mockResolvedValue(true),
            }));

            document.body.innerHTML = `
                <form>
                    <input type="checkbox" id="newletter_cb" value="off" />
                    <button type="button" name="submit_button">Submit</button>
                </form>
            `;

            const options: SDKOptions = {
                organizationId: "test-org-id",
                checkoutCampaignId: "test-checkout-id",
                pipelineCampaignId: "test-pipeline-id",
                features: { organizationPipeline: true },
            };

            const tool = new OrganizationPipelineTool(options);
            await tool.initialize();

            // Check the checkbox, but value is "off" not "on"
            const checkbox = document.getElementById(
                "newletter_cb"
            ) as HTMLInputElement;
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event("change"));

            // Value should still be false since value doesn't match true_value
            const formData = tool.getFormData();
            expect(formData.ainternal_run_pipeline).toBe(false);
        });

        it("should call edge function when checkbox with true_value is checked and submitted", async () => {
            const runPipelineMock = jest.fn().mockResolvedValue(true);

            mockSupabaseService.SupabaseService.mockImplementation(() => ({
                getPipelineCampaign: jest.fn().mockResolvedValue({
                    id: "test-pipeline-id",
                    input_mapping: {
                        email: {
                            type: "input",
                            selector_type: "name",
                            selector_value: "email",
                            default_value: "",
                        },
                        ainternal_run_pipeline: {
                            type: "checkbox",
                            selector_type: "id",
                            selector_value: "newletter_cb",
                            true_value: "on",
                        },
                    },
                    button_mapping: {
                        selector_type: "name",
                        selector_value: "submit_button",
                    },
                    additional_properties: {
                        form_id: 79,
                        from_element: "signup_form",
                    },
                    organization_id: "test-org-id",
                }),
                runOrganizationPipeline: runPipelineMock,
            }));

            document.body.innerHTML = `
                <form>
                    <input type="email" name="email" />
                    <input type="checkbox" id="newletter_cb" value="on" />
                    <button type="button" name="submit_button">Submit</button>
                </form>
            `;

            const options: SDKOptions = {
                organizationId: "test-org-id",
                checkoutCampaignId: "test-checkout-id",
                pipelineCampaignId: "test-pipeline-id",
                features: { organizationPipeline: true },
            };

            const tool = new OrganizationPipelineTool(options);
            await tool.initialize();

            // Fill in email
            const emailInput = document.querySelector(
                'input[name="email"]'
            ) as HTMLInputElement;
            emailInput.value = "test@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            // Check the checkbox
            const checkbox = document.getElementById(
                "newletter_cb"
            ) as HTMLInputElement;
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event("change"));

            // Click submit button
            const submitButton = document.querySelector(
                'button[name="submit_button"]'
            ) as HTMLElement;
            submitButton.dispatchEvent(
                new Event("click", { cancelable: true })
            );

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Should have called the edge function since checkbox is checked
            expect(runPipelineMock).toHaveBeenCalledTimes(1);
            const payload = runPipelineMock.mock.calls[0][0];
            expect(payload.ainternal_run_pipeline).toBe(true);
            expect(payload.email).toBe("test@example.com");
        });
    });

    describe("Button Toggle Functionality", () => {
        it("should toggle boolean value when button with toggle mode is clicked", async () => {
            mockSupabaseService.SupabaseService.mockImplementation(() => ({
                getPipelineCampaign: jest.fn().mockResolvedValue({
                    id: "test-pipeline-id",
                    input_mapping: {
                        email: {
                            type: "input",
                            selector_type: "name",
                            selector_value: "emailAddress",
                            default_value: "",
                        },
                        ainternal_run_pipeline: {
                            type: "button",
                            selector_type: "id",
                            selector_value: "newsletter_cb",
                            default_value: false,
                            mode: "toggle",
                        },
                    },
                    button_mapping: {
                        selector_type: "name",
                        selector_value: "confirm_booking_button",
                    },
                    additional_properties: {
                        status: "Booket",
                        form_id: 79,
                        from_element: "booking_form",
                    },
                    organization_id: "test-org-id",
                }),
                runOrganizationPipeline: jest.fn().mockResolvedValue(true),
            }));

            document.body.innerHTML = `
                <form>
                    <input type="email" name="emailAddress" />
                    <input type="checkbox" id="newsletter_cb" />
                    <button type="button" name="confirm_booking_button">Confirm Booking</button>
                </form>
            `;

            const options: SDKOptions = {
                organizationId: "test-org-id",
                checkoutCampaignId: "test-checkout-id",
                pipelineCampaignId: "test-pipeline-id",
                features: { organizationPipeline: true },
            };

            const tool = new OrganizationPipelineTool(options);
            await tool.initialize();

            // Initial value should be false (default_value)
            let formData = tool.getFormData();
            expect(formData.ainternal_run_pipeline).toBe(false);

            // Click the toggle button
            const toggleButton = document.getElementById(
                "newsletter_cb"
            ) as HTMLElement;
            toggleButton.dispatchEvent(
                new Event("click", { cancelable: true })
            );

            // Value should be toggled to true
            formData = tool.getFormData();
            expect(formData.ainternal_run_pipeline).toBe(true);

            // Click again to toggle back
            toggleButton.dispatchEvent(
                new Event("click", { cancelable: true })
            );
            formData = tool.getFormData();
            expect(formData.ainternal_run_pipeline).toBe(false);
        });
    });

    describe("Submit and Pipeline Execution", () => {
        it("should call edge function when ainternal_run_pipeline is true in additional_properties", async () => {
            const runPipelineMock = jest.fn().mockResolvedValue(true);

            mockSupabaseService.SupabaseService.mockImplementation(() => ({
                getPipelineCampaign: jest.fn().mockResolvedValue({
                    id: "30893953-c953-4137-b9aa-2a2ff3f9f2e9",
                    input_mapping: {
                        email: {
                            type: "input",
                            selector_type: "name",
                            selector_value: "email",
                            default_value: "",
                        },
                    },
                    button_mapping: {
                        selector_type: "querySelector",
                        selector_value: "button[type='submit']",
                    },
                    additional_properties: {
                        form_id: 79,
                        from_element: "signup_form",
                        ainternal_run_pipeline: true,
                    },
                    organization_id: "94d03439-383a-43b0-8666-9d7cf5aa17fc",
                }),
                runOrganizationPipeline: runPipelineMock,
            }));

            document.body.innerHTML = `
                <form>
                    <input type="email" name="email" />
                    <button type="submit">Submit</button>
                </form>
            `;

            const options: SDKOptions = {
                organizationId: "test-org-id",
                checkoutCampaignId: "test-checkout-id",
                pipelineCampaignId: "30893953-c953-4137-b9aa-2a2ff3f9f2e9",
                features: { organizationPipeline: true },
            };

            const tool = new OrganizationPipelineTool(options);
            await tool.initialize();

            // Fill in email
            const emailInput = document.querySelector(
                'input[name="email"]'
            ) as HTMLInputElement;
            emailInput.value = "test@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            // Click submit button
            const submitButton = document.querySelector(
                "button[type='submit']"
            ) as HTMLElement;
            submitButton.dispatchEvent(
                new Event("click", { cancelable: true })
            );

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Should have called the edge function
            expect(runPipelineMock).toHaveBeenCalledTimes(1);
            const payload = runPipelineMock.mock.calls[0][0];
            expect(payload.ainternal_pipeline_campaign_id).toBe(
                "30893953-c953-4137-b9aa-2a2ff3f9f2e9"
            );
            expect(payload.ainternal_run_pipeline).toBe(true);
            expect(payload.form_id).toBe(79);
            expect(payload.from_element).toBe("signup_form");
            expect(payload.email).toBe("test@example.com");
        });

        it("should call edge function when ainternal_run_pipeline is toggled to true", async () => {
            const runPipelineMock = jest.fn().mockResolvedValue(true);

            mockSupabaseService.SupabaseService.mockImplementation(() => ({
                getPipelineCampaign: jest.fn().mockResolvedValue({
                    id: "c9edaae1-42e5-4115-b680-b5e22b049411",
                    input_mapping: {
                        email: {
                            type: "input",
                            selector_type: "name",
                            selector_value: "emailAddress",
                            default_value: "",
                        },
                        ainternal_run_pipeline: {
                            type: "button",
                            selector_type: "id",
                            selector_value: "newsletter_cb",
                            default_value: false,
                            mode: "toggle",
                        },
                    },
                    button_mapping: {
                        selector_type: "name",
                        selector_value: "confirm_booking_button",
                    },
                    additional_properties: {
                        status: "Booket",
                        form_id: 79,
                        from_element: "booking_form",
                    },
                    organization_id: "94d03439-383a-43b0-8666-9d7cf5aa17fc",
                }),
                runOrganizationPipeline: runPipelineMock,
            }));

            document.body.innerHTML = `
                <form>
                    <input type="email" name="emailAddress" />
                    <input type="checkbox" id="newsletter_cb" />
                    <button type="button" name="confirm_booking_button">Confirm Booking</button>
                </form>
            `;

            const options: SDKOptions = {
                organizationId: "test-org-id",
                checkoutCampaignId: "test-checkout-id",
                pipelineCampaignId: "c9edaae1-42e5-4115-b680-b5e22b049411",
                features: { organizationPipeline: true },
            };

            const tool = new OrganizationPipelineTool(options);
            await tool.initialize();

            // Fill in email
            const emailInput = document.querySelector(
                'input[name="emailAddress"]'
            ) as HTMLInputElement;
            emailInput.value = "booking@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            // Toggle the checkbox to enable pipeline
            const toggleButton = document.getElementById(
                "newsletter_cb"
            ) as HTMLElement;
            toggleButton.dispatchEvent(
                new Event("click", { cancelable: true })
            );

            // Click submit button
            const submitButton = document.querySelector(
                'button[name="confirm_booking_button"]'
            ) as HTMLElement;
            submitButton.dispatchEvent(
                new Event("click", { cancelable: true })
            );

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Should have called the edge function
            expect(runPipelineMock).toHaveBeenCalledTimes(1);
            const payload = runPipelineMock.mock.calls[0][0];
            expect(payload.ainternal_pipeline_campaign_id).toBe(
                "c9edaae1-42e5-4115-b680-b5e22b049411"
            );
            expect(payload.ainternal_run_pipeline).toBe(true);
            expect(payload.status).toBe("Booket");
            expect(payload.form_id).toBe(79);
            expect(payload.from_element).toBe("booking_form");
            expect(payload.email).toBe("booking@example.com");
        });

        it("should NOT call edge function when ainternal_run_pipeline is false", async () => {
            const runPipelineMock = jest.fn().mockResolvedValue(true);

            mockSupabaseService.SupabaseService.mockImplementation(() => ({
                getPipelineCampaign: jest.fn().mockResolvedValue({
                    id: "test-pipeline-id",
                    input_mapping: {
                        email: {
                            type: "input",
                            selector_type: "name",
                            selector_value: "email",
                            default_value: "",
                        },
                    },
                    button_mapping: {
                        selector_type: "name",
                        selector_value: "submit_button",
                    },
                    additional_properties: {
                        form_id: 79,
                        from_element: "signup_form",
                        ainternal_run_pipeline: false,
                    },
                    organization_id: "test-org-id",
                }),
                runOrganizationPipeline: runPipelineMock,
            }));

            document.body.innerHTML = `
                <form>
                    <input type="email" name="email" />
                    <button type="button" name="submit_button">Submit</button>
                </form>
            `;

            const options: SDKOptions = {
                organizationId: "test-org-id",
                checkoutCampaignId: "test-checkout-id",
                pipelineCampaignId: "test-pipeline-id",
                features: { organizationPipeline: true },
            };

            const tool = new OrganizationPipelineTool(options);
            await tool.initialize();

            // Fill in email
            const emailInput = document.querySelector(
                'input[name="email"]'
            ) as HTMLInputElement;
            emailInput.value = "test@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            // Click submit button
            const submitButton = document.querySelector(
                'button[name="submit_button"]'
            ) as HTMLElement;
            submitButton.dispatchEvent(
                new Event("click", { cancelable: true })
            );

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Should NOT have called the edge function
            expect(runPipelineMock).not.toHaveBeenCalled();
        });
    });

    describe("Payload Construction", () => {
        it("should merge additional_properties and form data correctly", async () => {
            const runPipelineMock = jest.fn().mockResolvedValue(true);

            mockSupabaseService.SupabaseService.mockImplementation(() => ({
                getPipelineCampaign: jest.fn().mockResolvedValue({
                    id: "test-pipeline-id",
                    input_mapping: {
                        email: {
                            type: "input",
                            selector_type: "name",
                            selector_value: "email",
                            default_value: "",
                        },
                    },
                    button_mapping: {
                        selector_type: "name",
                        selector_value: "submit_button",
                    },
                    additional_properties: {
                        form_id: 79,
                        from_element: "signup_form",
                        custom_field: "static_value",
                        ainternal_run_pipeline: true,
                    },
                    organization_id: "test-org-id",
                }),
                runOrganizationPipeline: runPipelineMock,
            }));

            document.body.innerHTML = `
                <form>
                    <input type="email" name="email" />
                    <button type="button" name="submit_button">Submit</button>
                </form>
            `;

            const options: SDKOptions = {
                organizationId: "test-org-id",
                checkoutCampaignId: "test-checkout-id",
                pipelineCampaignId: "test-pipeline-id",
                features: { organizationPipeline: true },
            };

            const tool = new OrganizationPipelineTool(options);
            await tool.initialize();

            // Fill in email
            const emailInput = document.querySelector(
                'input[name="email"]'
            ) as HTMLInputElement;
            emailInput.value = "user@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            // Click submit button
            const submitButton = document.querySelector(
                'button[name="submit_button"]'
            ) as HTMLElement;
            submitButton.dispatchEvent(
                new Event("click", { cancelable: true })
            );

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 100));

            const payload = runPipelineMock.mock.calls[0][0];
            expect(payload.ainternal_pipeline_campaign_id).toBe(
                "test-pipeline-id"
            );
            expect(payload.email).toBe("user@example.com");
            expect(payload.form_id).toBe(79);
            expect(payload.from_element).toBe("signup_form");
            expect(payload.custom_field).toBe("static_value");
            expect(payload.ainternal_run_pipeline).toBe(true);
        });

        it("should allow form data to override additional_properties", async () => {
            const runPipelineMock = jest.fn().mockResolvedValue(true);

            mockSupabaseService.SupabaseService.mockImplementation(() => ({
                getPipelineCampaign: jest.fn().mockResolvedValue({
                    id: "test-pipeline-id",
                    input_mapping: {
                        email: {
                            type: "input",
                            selector_type: "name",
                            selector_value: "email",
                            default_value: "",
                        },
                        custom_field: {
                            type: "input",
                            selector_type: "name",
                            selector_value: "custom_field",
                            default_value: "",
                        },
                    },
                    button_mapping: {
                        selector_type: "name",
                        selector_value: "submit_button",
                    },
                    additional_properties: {
                        custom_field: "static_value",
                        ainternal_run_pipeline: true,
                    },
                    organization_id: "test-org-id",
                }),
                runOrganizationPipeline: runPipelineMock,
            }));

            document.body.innerHTML = `
                <form>
                    <input type="email" name="email" />
                    <input type="text" name="custom_field" />
                    <button type="button" name="submit_button">Submit</button>
                </form>
            `;

            const options: SDKOptions = {
                organizationId: "test-org-id",
                checkoutCampaignId: "test-checkout-id",
                pipelineCampaignId: "test-pipeline-id",
                features: { organizationPipeline: true },
            };

            const tool = new OrganizationPipelineTool(options);
            await tool.initialize();

            // Fill in fields
            const emailInput = document.querySelector(
                'input[name="email"]'
            ) as HTMLInputElement;
            emailInput.value = "user@example.com";
            emailInput.dispatchEvent(new Event("blur"));

            const customFieldInput = document.querySelector(
                'input[name="custom_field"]'
            ) as HTMLInputElement;
            customFieldInput.value = "user_override_value";
            customFieldInput.dispatchEvent(new Event("blur"));

            // Click submit button
            const submitButton = document.querySelector(
                'button[name="submit_button"]'
            ) as HTMLElement;
            submitButton.dispatchEvent(
                new Event("click", { cancelable: true })
            );

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 100));

            const payload = runPipelineMock.mock.calls[0][0];
            // User input should override static value
            expect(payload.custom_field).toBe("user_override_value");
        });
    });

    describe("Cleanup", () => {
        it("should clean up event listeners on destroy", async () => {
            mockSupabaseService.SupabaseService.mockImplementation(() => ({
                getPipelineCampaign: jest.fn().mockResolvedValue({
                    id: "test-pipeline-id",
                    input_mapping: {
                        email: {
                            type: "input",
                            selector_type: "name",
                            selector_value: "email",
                            default_value: "",
                        },
                    },
                    button_mapping: {
                        selector_type: "name",
                        selector_value: "submit_button",
                    },
                    additional_properties: {},
                    organization_id: "test-org-id",
                }),
                runOrganizationPipeline: jest.fn().mockResolvedValue(true),
            }));

            document.body.innerHTML = `
                <form>
                    <input type="email" name="email" />
                    <button type="button" name="submit_button">Submit</button>
                </form>
            `;

            const options: SDKOptions = {
                organizationId: "test-org-id",
                checkoutCampaignId: "test-checkout-id",
                pipelineCampaignId: "test-pipeline-id",
                features: { organizationPipeline: true },
            };

            const tool = new OrganizationPipelineTool(options);
            await tool.initialize();

            // Destroy the tool
            tool.destroy();

            // After destroy, form data should be empty
            const formData = tool.getFormData();
            expect(Object.keys(formData)).toHaveLength(0);
        });
    });
});
