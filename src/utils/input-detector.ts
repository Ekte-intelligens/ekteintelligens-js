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
        this.inputMapping = inputMapping;
    }

    public setOnContentUpdate(
        callback: (content: Record<string, any>, sessionId?: string) => void
    ) {
        this.onContentUpdate = callback;
    }

    public setSessionId(sessionId: string) {
        this.sessionId = sessionId;
    }

    public startListening() {
        const inputs = this.getTargetInputs();

        inputs.forEach((input) => {
            input.addEventListener("blur", this.handleInputBlur.bind(this));
        });
    }

    public stopListening() {
        const inputs = this.getTargetInputs();

        inputs.forEach((input) => {
            input.removeEventListener("blur", this.handleInputBlur.bind(this));
        });
    }

    private getTargetInputs(): HTMLInputElement[] {
        if (!this.inputMapping) {
            // Listen to all inputs if no input mapping
            return Array.from(document.querySelectorAll("input"));
        }

        if (this.inputMapping.form_selector) {
            // Listen to all inputs within the specified form
            const form = document.querySelector(
                this.inputMapping.form_selector
            );
            if (form) {
                return Array.from(form.querySelectorAll("input"));
            }
        }

        if (this.inputMapping.inputs && this.inputMapping.inputs.length > 0) {
            // Listen to specific inputs
            return this.inputMapping.inputs
                .map((selector) => document.querySelector(selector))
                .filter((input): input is HTMLInputElement => input !== null);
        }

        // Fallback to all inputs
        return Array.from(document.querySelectorAll("input"));
    }

    private handleInputBlur(event: Event) {
        const input = event.target as HTMLInputElement;
        const fieldName = this.getFieldName(input);
        const value = input.value.trim();

        if (value) {
            this.content[fieldName] = value;

            // Check if we have email or phone
            if (this.isEmailOrPhone(fieldName, value)) {
                this.hasEmailOrPhone = true;
            }

            // Only call the callback if we have email/phone and the callback is set
            if (this.hasEmailOrPhone && this.onContentUpdate) {
                this.onContentUpdate(this.content, this.sessionId);
            }
        }
    }

    private getFieldName(input: HTMLInputElement): string {
        // Try to get name from various attributes
        return (
            input.name ||
            input.id ||
            input.getAttribute("data-field") ||
            input.type ||
            "unknown"
        );
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
