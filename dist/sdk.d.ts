import { SDKOptions } from './types';
import { AbandonedCartTool } from './tools/abandoned-cart';
import { OrganizationPipelineTool } from './tools/organization-pipeline';

export declare class EkteIntelligensSDK {
    private options;
    private tools;
    private _isInitialized;
    constructor(options: SDKOptions);
    initialize(): Promise<boolean>;
    getAbandonedCartTool(): AbandonedCartTool | undefined;
    getOrganizationPipelineTool(): OrganizationPipelineTool | undefined;
    destroy(): void;
    isInitialized(): boolean;
}
//# sourceMappingURL=sdk.d.ts.map