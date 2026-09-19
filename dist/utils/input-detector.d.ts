import { InputMapping } from '../types';

export declare class InputDetector {
    private inputMapping;
    private content;
    private sessionId?;
    private hasEmailOrPhone;
    private onContentUpdate?;
    constructor(inputMapping: InputMapping | null);
    private cleanInputMapping;
    private cleanSelector;
    setOnContentUpdate(callback: (content: Record<string, any>, sessionId?: string) => void): void;
    setSessionId(sessionId: string): void;
    private readonly boundHandleInputBlur;
    startListening(): void;
    stopListening(): void;
    private static readonly IGNORED_INPUT_TYPES;
    private static readonly SENSITIVE_NAME;
    /**
     * Credentials, payment-card and national-id inputs are never observed or
     * stored, whatever the campaign's input mapping says. Detected by input
     * type, the autocomplete hint (cc-*, *-password, one-time-code) and
     * name/id.
     */
    private isSensitiveInput;
    private getTargetInputs;
    private isInputExcluded;
    private handleInputBlur;
    private getFieldName;
    private isEmailOrPhone;
    private isValidEmail;
    private isValidPhone;
    getContent(): Record<string, any>;
    hasEmailOrPhoneNumber(): boolean;
}
//# sourceMappingURL=input-detector.d.ts.map