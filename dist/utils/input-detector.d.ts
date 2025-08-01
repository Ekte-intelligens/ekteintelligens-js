import { InputMapping } from '../types';

export declare class InputDetector {
    private inputMapping;
    private content;
    private sessionId?;
    private hasEmailOrPhone;
    private onContentUpdate?;
    constructor(inputMapping: InputMapping | null);
    private decodeInputMapping;
    setOnContentUpdate(callback: (content: Record<string, any>, sessionId?: string) => void): void;
    setSessionId(sessionId: string): void;
    startListening(): void;
    stopListening(): void;
    private getTargetInputs;
    private handleInputBlur;
    private getFieldName;
    private isEmailOrPhone;
    private isValidEmail;
    private isValidPhone;
    getContent(): Record<string, any>;
    hasEmailOrPhoneNumber(): boolean;
}
//# sourceMappingURL=input-detector.d.ts.map