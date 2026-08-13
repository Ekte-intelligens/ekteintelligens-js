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
    /**
     * Grant or revoke analytics-persistence consent. Wire this to the CMP's
     * consent callback when the SDK is configured with `requireConsent: true`
     * (Cookiebot, OneTrust and TCF-compliant CMPs are also auto-detected).
     * Revoking clears the persisted payload and cookie.
     */
    setConsent(granted: boolean): void;
    destroy(): void;
    isInitialized(): boolean;
}
//# sourceMappingURL=sdk.d.ts.map