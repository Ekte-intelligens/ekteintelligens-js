import { SDKOptions } from './types';
import { AbandonedCartTool } from './tools/abandoned-cart';
import { OrganizationPipelineTool } from './tools/organization-pipeline';
import { EnhancedInsightsTool } from './tools/enhanced-insights';
import { LinkTrackingTool } from './tools/link-tracking';

export declare class EkteIntelligensSDK {
    private options;
    private tools;
    private _isInitialized;
    constructor(options: SDKOptions);
    initialize(): Promise<boolean>;
    getAbandonedCartTool(): AbandonedCartTool | undefined;
    getOrganizationPipelineTool(): OrganizationPipelineTool | undefined;
    getEnhancedInsightsTool(): EnhancedInsightsTool | undefined;
    getLinkTrackingTool(): LinkTrackingTool | undefined;
    destroy(): void;
    isInitialized(): boolean;
}
//# sourceMappingURL=sdk.d.ts.map