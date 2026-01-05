import { SupabaseService } from "../services/supabase-service";
import {
    SDKOptions,
    OrganizationPipelineCampaign,
    OrganizationPipelinePayload,
} from "../types";

export class OrganizationPipelineTool {
    private options: SDKOptions;
    private supabaseService: SupabaseService;
    private campaign?: OrganizationPipelineCampaign;
    private formData: Record<string, any> = {};
    private inputListeners: Array<{
        element: HTMLElement;
        fieldName: string;
        handler: (event: Event) => void;
    }> = [];
    private buttonListeners: Array<{
        element: HTMLElement;
        fieldName: string;
        handler: (event: Event) => void;
    }> = [];
    private submitListener?: {
        element: HTMLElement;
        handler: (event: Event) => void;
    };
    private isInitialized = false;

    constructor(options: SDKOptions) {
        this.options = options;
        this.supabaseService = new SupabaseService(
            options.supabaseUrl,
            options.supabaseAnonKey
        );
    }

    async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            return true;
        }

        if (!this.options.pipelineCampaignId) {
            console.error(
                "pipelineCampaignId is required for organization pipeline"
            );
            return false;
        }

        try {
            // Fetch campaign data from Supabase
            const campaign = await this.supabaseService.getPipelineCampaign(
                this.options.pipelineCampaignId
            );

            if (!campaign) {
                console.error("Failed to fetch pipeline campaign data");
                return false;
            }

            this.campaign = campaign;

            // Initialize form data with default values
            this.initializeFormData();

            // Set up input listeners
            this.setupInputListeners();

            // Set up button toggle listeners
            this.setupButtonListeners();

            // Set up submit button listener
            this.setupSubmitListener();

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error(
                "Failed to initialize organization pipeline tool:",
                error
            );
            return false;
        }
    }

    private initializeFormData(): void {
        if (!this.campaign) return;

        const { input_mapping } = this.campaign;

        Object.keys(input_mapping).forEach((fieldName) => {
            const mapping = input_mapping[fieldName];

            // For checkbox type, initialize based on current checkbox state
            if (mapping.type === "checkbox") {
                const element = this.getElementBySelector(
                    mapping.selector_type,
                    mapping.selector_value
                );
                if (element) {
                    const trueValue = mapping.true_value || "on";
                    const isChecked = this.isCheckboxChecked(element);
                    const elementValue = this.getCheckboxValue(element);

                    if (isChecked && elementValue === trueValue) {
                        this.formData[fieldName] = true;
                    } else {
                        this.formData[fieldName] = false;
                    }
                } else {
                    // Element not found, use default or false
                    this.formData[fieldName] =
                        mapping.default_value !== undefined
                            ? mapping.default_value
                            : false;
                }
            } else if (mapping.default_value !== undefined) {
                this.formData[fieldName] = mapping.default_value;
            }
        });
    }

    private setupInputListeners(): void {
        if (!this.campaign) return;

        const { input_mapping } = this.campaign;

        Object.keys(input_mapping).forEach((fieldName) => {
            const mapping = input_mapping[fieldName];

            // Handle both "input" and "checkbox" types
            if (mapping.type !== "input" && mapping.type !== "checkbox") return;

            const element = this.getElementBySelector(
                mapping.selector_type,
                mapping.selector_value
            );

            if (!element) {
                console.warn(
                    `Could not find element for field "${fieldName}" with selector type "${mapping.selector_type}" and value "${mapping.selector_value}"`
                );
                return;
            }

            const handler = (event: Event) => {
                this.handleInputChange(
                    fieldName,
                    event.target as HTMLElement,
                    mapping
                );
            };

            // For checkboxes, listen to appropriate events
            // For regular inputs, we listen to both blur and change
            if (mapping.type === "checkbox") {
                // For button-based checkboxes (role="checkbox"), use MutationObserver
                // to watch for attribute changes, and also listen to click events
                if (
                    element instanceof HTMLButtonElement ||
                    element.getAttribute("role") === "checkbox"
                ) {
                    // Listen to click events
                    element.addEventListener("click", () => {
                        // Use setTimeout to check state after the click has been processed
                        // and the application has updated the aria-checked/data-state attributes
                        setTimeout(() => {
                            this.handleInputChange(fieldName, element, mapping);
                        }, 0);
                    });

                    // Also use MutationObserver to watch for attribute changes
                    // This ensures we catch state changes even if they happen asynchronously
                    const observer = new MutationObserver(() => {
                        this.handleInputChange(fieldName, element, mapping);
                    });

                    observer.observe(element, {
                        attributes: true,
                        attributeFilter: ["aria-checked", "data-state"],
                    });

                    // Store observer for cleanup
                    (element as any)._eiObserver = observer;
                } else {
                    element.addEventListener("change", handler);
                }
                // Also initialize the value immediately
                this.handleInputChange(fieldName, element, mapping);
            } else {
                element.addEventListener("blur", handler);
                element.addEventListener("change", handler);
            }

            this.inputListeners.push({ element, fieldName, handler });
        });
    }

    private setupButtonListeners(): void {
        if (!this.campaign) return;

        const { input_mapping } = this.campaign;

        Object.keys(input_mapping).forEach((fieldName) => {
            const mapping = input_mapping[fieldName];

            if (mapping.type !== "button" || mapping.mode !== "toggle") return;

            const element = this.getElementBySelector(
                mapping.selector_type,
                mapping.selector_value
            );

            if (!element) {
                console.warn(
                    `Could not find button element for field "${fieldName}" with selector type "${mapping.selector_type}" and value "${mapping.selector_value}"`
                );
                return;
            }

            const handler = (event: Event) => {
                event.preventDefault();
                this.handleButtonToggle(fieldName, mapping.default_value);
            };

            element.addEventListener("click", handler);

            this.buttonListeners.push({ element, fieldName, handler });
        });
    }

    private setupSubmitListener(): void {
        if (!this.campaign) return;

        const { button_mapping } = this.campaign;

        const element = this.getElementBySelector(
            button_mapping.selector_type,
            button_mapping.selector_value
        );

        if (!element) {
            console.warn(
                `Could not find submit button with selector type "${button_mapping.selector_type}" and value "${button_mapping.selector_value}"`
            );
            return;
        }

        const handler = (event: Event) => {
            this.handleSubmit(event);
        };

        element.addEventListener("click", handler);

        this.submitListener = { element, handler };
    }

    private getElementBySelector(
        selectorType: string,
        selectorValue: string
    ): HTMLElement | null {
        // Clean selector value (handle escaped backslashes from database)
        const cleanedValue = selectorValue.replace(/\\\\/g, "\\");

        switch (selectorType) {
            case "name":
                return document.querySelector(
                    `[name="${cleanedValue}"]`
                ) as HTMLElement;

            case "id":
                return document.getElementById(cleanedValue);

            case "querySelector":
                try {
                    return document.querySelector(cleanedValue) as HTMLElement;
                } catch (error) {
                    console.warn(
                        `Invalid querySelector: ${cleanedValue}`,
                        error
                    );
                    return null;
                }

            case "class":
                return document.querySelector(
                    `.${cleanedValue}`
                ) as HTMLElement;

            default:
                // Handle data-* attributes and other custom selectors
                if (selectorType.startsWith("data-")) {
                    return document.querySelector(
                        `[${selectorType}="${cleanedValue}"]`
                    ) as HTMLElement;
                }
                // Try as attribute selector
                return document.querySelector(
                    `[${selectorType}="${cleanedValue}"]`
                ) as HTMLElement;
        }
    }

    private isCheckboxChecked(element: HTMLElement): boolean {
        // Standard HTML checkbox
        if (
            element instanceof HTMLInputElement &&
            element.type === "checkbox"
        ) {
            return element.checked;
        }

        // Custom checkbox button with role="checkbox"
        if (element.getAttribute("role") === "checkbox") {
            const ariaChecked = element.getAttribute("aria-checked");
            const dataState = element.getAttribute("data-state");

            // Check aria-checked attribute
            if (ariaChecked === "true") {
                return true;
            }
            if (ariaChecked === "false") {
                return false;
            }

            // Check data-state attribute
            if (dataState === "checked") {
                return true;
            }
            if (dataState === "unchecked") {
                return false;
            }
        }

        return false;
    }

    private getCheckboxValue(element: HTMLElement): string {
        // Standard HTML checkbox
        if (
            element instanceof HTMLInputElement &&
            element.type === "checkbox"
        ) {
            return element.value || "on";
        }

        // Custom checkbox button - get value attribute
        return element.getAttribute("value") || "on";
    }

    private handleInputChange(
        fieldName: string,
        element: HTMLElement,
        mapping?: {
            type?: string;
            true_value?: string;
        }
    ): void {
        // Handle checkbox type with true_value
        if (mapping?.type === "checkbox") {
            const trueValue = mapping.true_value || "on";
            const isChecked = this.isCheckboxChecked(element);
            const elementValue = this.getCheckboxValue(element);

            // Checkbox is checked and value matches true_value
            if (isChecked && elementValue === trueValue) {
                this.formData[fieldName] = true;
            } else {
                this.formData[fieldName] = false;
            }
            return;
        }

        // Handle regular input elements
        if (element instanceof HTMLInputElement) {
            this.formData[fieldName] = element.value;
        } else if (element instanceof HTMLSelectElement) {
            this.formData[fieldName] = element.value;
        } else if (element instanceof HTMLTextAreaElement) {
            this.formData[fieldName] = element.value;
        } else {
            // For other elements, try to get text content or value attribute
            this.formData[fieldName] =
                element.getAttribute("value") ||
                element.textContent?.trim() ||
                "";
        }
    }

    private handleButtonToggle(fieldName: string, defaultValue: any): void {
        // Get current value or use default
        const currentValue = this.formData[fieldName] ?? defaultValue ?? false;

        // Toggle boolean value
        this.formData[fieldName] = !currentValue;
    }

    private collectFormData(): Record<string, any> {
        // Start with additional_properties from campaign (base metadata)
        const payload: Record<string, any> = {
            ...(this.campaign?.additional_properties || {}),
        };

        // Override with collected form data (user inputs take precedence)
        Object.assign(payload, this.formData);

        // Add pipeline campaign ID
        if (this.campaign) {
            payload.ainternal_pipeline_campaign_id = this.campaign.id;
        }

        return payload;
    }

    private async handleSubmit(event: Event): Promise<void> {
        // Prevent default form submission if event is cancelable
        if (event.cancelable) {
            event.preventDefault();
        }

        try {
            // Collect all form data
            const payload = this.collectFormData();

            // Check if we should run the pipeline
            if (payload.ainternal_run_pipeline === true) {
                // Send to Supabase edge function
                const success =
                    await this.supabaseService.runOrganizationPipeline(
                        payload as OrganizationPipelinePayload
                    );

                if (!success) {
                    console.error("Failed to execute organization pipeline");
                }
            }
        } catch (error) {
            console.error("Error handling submit:", error);
        }
    }

    public destroy(): void {
        // Remove input listeners
        this.inputListeners.forEach(({ element, handler }) => {
            // Remove all possible event types
            element.removeEventListener("blur", handler);
            element.removeEventListener("change", handler);
            element.removeEventListener("click", handler);

            // Disconnect MutationObserver if it exists
            if ((element as any)._eiObserver) {
                (element as any)._eiObserver.disconnect();
                delete (element as any)._eiObserver;
            }
        });
        this.inputListeners = [];

        // Remove button listeners
        this.buttonListeners.forEach(({ element, handler }) => {
            element.removeEventListener("click", handler);
        });
        this.buttonListeners = [];

        // Remove submit listener
        if (this.submitListener) {
            this.submitListener.element.removeEventListener(
                "click",
                this.submitListener.handler
            );
            this.submitListener = undefined;
        }

        this.isInitialized = false;
        this.formData = {};
        this.campaign = undefined;
    }

    public getFormData(): Record<string, any> {
        return { ...this.formData };
    }
}
