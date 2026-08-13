import { SDKOptions } from "./types";
import { AbandonedCartTool } from "./tools/abandoned-cart";
import { OrganizationPipelineTool } from "./tools/organization-pipeline";
import { EnhancedInsightsTool } from "./tools/enhanced-insights";
import {
    ensureAnalyticsPayload,
    setAnalyticsConsent,
    isAnalyticsConsentGranted,
    onAnalyticsConsentChange,
} from "./utils/analytics-collector";
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
            // Capture first-touch attribution (UTM params, referrer, landing
            // page) regardless of which features are enabled — cart sessions
            // attach it, same-origin forms that read
            // `assistantAnalyticsPayload` depend on it, and the ei_analytics
            // cookie hands it across subdomains (e.g. site.com →
            // booking.site.com in a new tab). With `requireConsent: true`
            // nothing persists until setConsent(true) or a CMP grants it.
            ensureAnalyticsPayload({
                cookieDomain: this.options.cookieDomain,
                requireConsent: this.options.requireConsent,
                shareInsightsAcrossSubdomains:
                    this.options.shareInsightsAcrossSubdomains,
            });
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
                    this.options,
                );
                await organizationPipelineTool.initialize();
                this.tools.set(
                    "organizationPipeline",
                    organizationPipelineTool,
                );
            }

            if (this.options.features?.enhancedInsights) {
                // Page-visit recording writes to localStorage, so under
                // `requireConsent: true` it may only start once consent is
                // granted — and must stop (and wipe its history) if consent
                // is revoked. Without requireConsent this initializes
                // immediately, as before.
                const startInsights = async () => {
                    if (this.tools.has("enhancedInsights")) return;
                    const enhancedInsightsTool = new EnhancedInsightsTool(
                        this.options,
                    );
                    await enhancedInsightsTool.initialize();
                    this.tools.set("enhancedInsights", enhancedInsightsTool);
                };
                if (isAnalyticsConsentGranted()) {
                    await startInsights();
                }
                if (this.options.requireConsent) {
                    onAnalyticsConsentChange((granted) => {
                        if (granted) {
                            void startInsights();
                        } else {
                            const tool: EnhancedInsightsTool | undefined =
                                this.tools.get("enhancedInsights");
                            if (tool) {
                                tool.destroy();
                                tool.clearData();
                                this.tools.delete("enhancedInsights");
                            }
                        }
                    });
                }
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

    /**
     * Grant or revoke analytics-persistence consent. Wire this to the CMP's
     * consent callback when the SDK is configured with `requireConsent: true`
     * (Cookiebot, OneTrust and TCF-compliant CMPs are also auto-detected).
     * Revoking clears the persisted payload and cookie.
     */
    public setConsent(granted: boolean): void {
        setAnalyticsConsent(granted);
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
