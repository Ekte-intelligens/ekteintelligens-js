import { SDKOptions } from '../types';

export declare class OrganizationPipelineTool {
    private options;
    private supabaseService;
    private campaign?;
    private formData;
    private inputListeners;
    private buttonListeners;
    private submitListener?;
    private isInitialized;
    constructor(options: SDKOptions);
    initialize(): Promise<boolean>;
    private initializeFormData;
    private setupInputListeners;
    private setupButtonListeners;
    private setupSubmitListener;
    private getElementBySelector;
    private handleInputChange;
    private handleButtonToggle;
    private collectFormData;
    private handleSubmit;
    destroy(): void;
    getFormData(): Record<string, any>;
}
//# sourceMappingURL=organization-pipeline.d.ts.map