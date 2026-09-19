import { InputMapping } from "../types";

export class InputDetector {
    private inputMapping: InputMapping | null;
    private content: Record<string, any> = {};
    private sessionId?: string;
    private hasEmailOrPhone = false;
    private onContentUpdate?: (
        content: Record<string, any>,
        sessionId?: string
    ) => void;

    constructor(inputMapping: InputMapping | null) {
        this.inputMapping = this.cleanInputMapping(inputMapping);
    }

    private cleanInputMapping(
        inputMapping: InputMapping | null
    ): InputMapping | null {
        if (!inputMapping) return inputMapping;

        const cleanedMapping: InputMapping = { ...inputMapping };

        // Clean form_selector if present
        if (cleanedMapping.form_selector) {
            cleanedMapping.form_selector = this.cleanSelector(
                cleanedMapping.form_selector
            );
        }

        // Clean inputs array if present
        if (cleanedMapping.inputs && cleanedMapping.inputs.length > 0) {
            cleanedMapping.inputs = cleanedMapping.inputs.map((selector) =>
                this.cleanSelector(selector)
            );
        }

        return cleanedMapping;
    }

    private cleanSelector(selector: string): string {
        // Remove excessive backslash escaping that can occur when fetching from database
        // Convert double backslashes to single backslashes
        return selector.replace(/\\\\/g, "\\");
    }

    public setOnContentUpdate(
        callback: (content: Record<string, any>, sessionId?: string) => void
    ) {
        this.onContentUpdate = callback;
    }

    public setSessionId(sessionId: string) {
        this.sessionId = sessionId;
    }

    // One stable reference: `.bind(this)` returns a new function on every
    // call, so removeEventListener(this.handleInputBlur.bind(this)) never
    // removed anything and a stop/start cycle stacked duplicate listeners.
    // Adding the same reference twice is a no-op, so restarts are safe too.
    private readonly boundHandleInputBlur = (event: Event) =>
        this.handleInputBlur(event);

    public startListening() {
        const inputs = this.getTargetInputs();

        inputs.forEach((input) => {
            input.addEventListener("blur", this.boundHandleInputBlur);
        });
    }

    public stopListening() {
        const inputs = this.getTargetInputs();

        inputs.forEach((input) => {
            input.removeEventListener("blur", this.boundHandleInputBlur);
        });
    }

    // Input types that never hold contact details worth recovering a cart
    // with. `password` is the one that matters: checkouts with a login or
    // create-account form had the password uploaded as session content.
    private static readonly IGNORED_INPUT_TYPES = new Set([
        "password",
        "hidden",
        "file",
        "submit",
        "button",
        "reset",
        "image",
    ]);

    // name/id fragments of credential, payment-card and national-id fields.
    // Short fragments need boundaries so ordinary fields are not dropped:
    // "businessName" contains "ssn", "accNumber" contains "ccnumber",
    // "cardNotes" starts like "cardNo".
    private static readonly SENSITIVE_NAME =
        /passw|passord|pwd|cvc|cvv|card[-_ ]?(number|(num|no)([^a-z]|$))|security[-_ ]?code|kontonummer|account[-_ ]?number|personnummer|f[oø]dselsnummer|(^|[^a-z])(ssn|iban)([^a-z]|$)|(^|[^a-z])cc[-_]?(number|num|csc|exp)/i;

    /**
     * Credentials, payment-card and national-id inputs are never observed or
     * stored, whatever the campaign's input mapping says. Detected by input
     * type, the autocomplete hint (cc-*, *-password, one-time-code) and
     * name/id.
     */
    private isSensitiveInput(input: HTMLInputElement): boolean {
        const type = (
            input.getAttribute("type") ||
            input.type ||
            ""
        ).toLowerCase();
        if (InputDetector.IGNORED_INPUT_TYPES.has(type)) return true;

        const autocomplete = (
            input.getAttribute("autocomplete") || ""
        ).toLowerCase();
        if (
            /(^|\s)(cc-[a-z-]+|current-password|new-password|one-time-code)(\s|$)/.test(
                autocomplete
            )
        ) {
            return true;
        }

        return (
            InputDetector.SENSITIVE_NAME.test(input.name || "") ||
            InputDetector.SENSITIVE_NAME.test(input.id || "")
        );
    }

    private getTargetInputs(): HTMLInputElement[] {
        const filterExcluded = (inputs: HTMLInputElement[]) =>
            inputs.filter(
                (input) =>
                    !this.isInputExcluded(input) &&
                    !this.isSensitiveInput(input)
            );

        if (!this.inputMapping) {
            return filterExcluded(
                Array.from(document.querySelectorAll("input"))
            );
        }

        if (this.inputMapping.form_selector) {
            const form = document.querySelector(
                this.inputMapping.form_selector
            );
            if (form) {
                return filterExcluded(
                    Array.from(form.querySelectorAll("input"))
                );
            }
        }

        if (this.inputMapping.inputs && this.inputMapping.inputs.length > 0) {
            return filterExcluded(
                this.inputMapping.inputs
                    .map((selector) => document.querySelector(selector))
                    .filter(
                        (input): input is HTMLInputElement => input !== null
                    )
            );
        }

        return filterExcluded(Array.from(document.querySelectorAll("input")));
    }

    private isInputExcluded(input: HTMLInputElement): boolean {
        const excluded = this.inputMapping?.excluded_inputs;
        if (!excluded || excluded.length === 0) return false;

        const name = (input.name || "").toLowerCase();
        const id = (input.id || "").toLowerCase();

        return excluded.some((entry) => {
            const e = entry.toLowerCase();
            return (name !== "" && e === name) || (id !== "" && e === id);
        });
    }

    private handleInputBlur(event: Event) {
        const input = event.target as HTMLInputElement;
        // Re-checked at blur time: show/hide-password toggles change the
        // input's type after the listeners were attached.
        if (this.isInputExcluded(input) || this.isSensitiveInput(input)) return;

        const fieldName = this.getFieldName(input);

        // A checkbox/radio has the same `value` ("on" by default) whether or
        // not it is ticked, so only a checked one is stored and unticking a
        // checkbox removes it again.
        if (input.type === "checkbox" || input.type === "radio") {
            if (!input.checked) {
                if (input.type === "checkbox" && fieldName in this.content) {
                    delete this.content[fieldName];
                    if (this.hasEmailOrPhone && this.onContentUpdate) {
                        this.onContentUpdate(this.content, this.sessionId);
                    }
                }
                return;
            }
        }

        const value = input.value.trim();

        if (value) {
            this.content[fieldName] = value;

            // Check if we have email or phone
            if (this.isEmailOrPhone(fieldName, value)) {
                this.hasEmailOrPhone = true;
            }

            // Call the callback if we have email/phone and the callback is set
            if (this.hasEmailOrPhone && this.onContentUpdate) {
                this.onContentUpdate(this.content, this.sessionId);
            }
        }
    }

    private getFieldName(input: HTMLInputElement): string {
        // Try to get name from various attributes
        let fieldName =
            input.name ||
            input.id ||
            input.getAttribute("data-field") ||
            input.type ||
            "unknown";

        // Apply field mapping if available
        if (
            this.inputMapping?.field_mappings &&
            this.inputMapping.field_mappings[fieldName]
        ) {
            fieldName = this.inputMapping.field_mappings[fieldName];
        } else if (this.inputMapping?.field_mappings) {
            // If no mapping found for name/id, try autocomplete-data attribute
            // This handles cases where name/id are randomized (e.g. SynXis SBE)
            const autocompleteData = input.getAttribute("autocomplete-data");
            if (
                autocompleteData &&
                this.inputMapping.field_mappings[autocompleteData]
            ) {
                fieldName = this.inputMapping.field_mappings[autocompleteData];
            }
        }

        return fieldName;
    }

    private isEmailOrPhone(fieldName: string, value: string): boolean {
        const fieldNameLower = fieldName.toLowerCase();

        // Check if field name indicates email or phone
        if (
            fieldNameLower.includes("email") ||
            fieldNameLower.includes("mail")
        ) {
            return this.isValidEmail(value);
        }

        if (
            fieldNameLower.includes("phone") ||
            fieldNameLower.includes("tel")
        ) {
            return this.isValidPhone(value);
        }

        // Check if value looks like email or phone
        return this.isValidEmail(value) || this.isValidPhone(value);
    }

    private isValidEmail(value: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }

    private isValidPhone(value: string): boolean {
        // Basic phone validation - at least 7 digits
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,}$/;
        return phoneRegex.test(value);
    }

    public getContent(): Record<string, any> {
        return { ...this.content };
    }

    public hasEmailOrPhoneNumber(): boolean {
        return this.hasEmailOrPhone;
    }
}
