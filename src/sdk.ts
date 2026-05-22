import { SDKOptions } from "./types";
import { AbandonedCartTool } from "./tools/abandoned-cart";
import { OrganizationPipelineTool } from "./tools/organization-pipeline";
import { EnhancedInsightsTool } from "./tools/enhanced-insights";
import { LinkTrackingTool } from "./tools/link-tracking";

export class EkteIntelligensSDK {
    private options: SDKOptions;
    private tools: Map<string, any> = new Map();
    private _isInitialized = false;

    constructor(options: SDKOptions) {
        this.options = options;
    }

    async initialize(): Promise<boolean> {
        if (this._isInitialized) {
            return true;
        }

        try {
            // Shortlink-open tracking always runs. It is a no-op unless the
            // URL carries an `?s=` funnel-subscriber parameter, so there is
            // no feature flag for it.
            const linkTrackingTool = new LinkTrackingTool(this.options);
            await linkTrackingTool.initialize();
            this.tools.set("linkTracking", linkTrackingTool);

            // Initialize enabled features
            if (this.options.features?.abandonedCart) {
                const abandonedCartTool = new AbandonedCartTool(this.options);
                await abandonedCartTool.initialize();
                this.tools.set("abandonedCart", abandonedCartTool);
            }

            if (this.options.features?.organizationPipeline) {
                const organizationPipelineTool = new OrganizationPipelineTool(
                    this.options
                );
                await organizationPipelineTool.initialize();
                this.tools.set(
                    "organizationPipeline",
                    organizationPipelineTool
                );
            }

            if (this.options.features?.enhancedInsights) {
                const enhancedInsightsTool = new EnhancedInsightsTool(
                    this.options
                );
                await enhancedInsightsTool.initialize();
                this.tools.set("enhancedInsights", enhancedInsightsTool);
            }

            this._isInitialized = true;
            // console.log("EkteIntelligens SDK initialized successfully");
            return true;
        } catch (error) {
            // console.error("Failed to initialize EkteIntelligens SDK:", error);
            return false;
        }
    }

    // Public API methods
    public getAbandonedCartTool(): AbandonedCartTool | undefined {
        return this.tools.get("abandonedCart");
    }

    public getOrganizationPipelineTool(): OrganizationPipelineTool | undefined {
        return this.tools.get("organizationPipeline");
    }

    public getEnhancedInsightsTool(): EnhancedInsightsTool | undefined {
        return this.tools.get("enhancedInsights");
    }

    public getLinkTrackingTool(): LinkTrackingTool | undefined {
        return this.tools.get("linkTracking");
    }

    public destroy(): void {
        this.tools.forEach((tool) => {
            if (tool.destroy) {
                tool.destroy();
            }
        });
        this.tools.clear();
        this._isInitialized = false;
    }

    public isInitialized(): boolean {
        return this._isInitialized;
    }
}
