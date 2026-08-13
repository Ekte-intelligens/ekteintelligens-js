export interface SDKOptions {
    organizationId: string;
    checkoutCampaignId: string;
    pipelineCampaignId?: string;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    features?: {
        abandonedCart?: boolean;
        organizationPipeline?: boolean;
        enhancedInsights?: boolean;
    };
    config?: {
        completedCheckout?: boolean;
    };
    /**
     * Parent domain for the cross-subdomain `ei_analytics` cookie, e.g.
     * ".site.com". When omitted, the widest domain the browser accepts a
     * cookie on is probed automatically.
     */
    cookieDomain?: string;
    /**
     * When true, analytics is held in memory and nothing is persisted
     * (sessionStorage/cookie) or attached to uploads until consent is granted
     * via sdk.setConsent(true) or an auto-detected CMP (Cookiebot, OneTrust,
     * TCF). Defaults to false: persist immediately.
     */
    requireConsent?: boolean;
    /**
     * When true, enhanced-insights page history is also shared across
     * subdomains: a compact per-origin summary (scalars + dwell-capped
     * time_per_page, never raw visits) is kept in the `ei_insights` cookie,
     * and uploads merge the other origins' summaries into this origin's
     * history. Defaults to false: insights stay per-origin, as before.
     */
    shareInsightsAcrossSubdomains?: boolean;
}
export interface InputMapping {
    form_selector?: string;
    inputs?: string[];
    field_mappings?: Record<string, string>;
    excluded_inputs?: string[];
}
export interface ProductMapping {
    [key: string]: any;
}
export interface CheckoutCampaign {
    id: string;
    product_mapping: ProductMapping;
    input_mapping: InputMapping | null;
    total_selector?: string;
    average_checkout_value?: number;
    type: "bookvisit" | "synxis" | "elinapms" | "default";
    config: {
        bookvisit?: {
            channel_id: string;
            autofields?: boolean;
        };
    };
}
export interface Content {
    [key: string]: any;
}
export interface DetectedProduct {
    id?: string;
    name?: string;
    price?: number;
    quantity?: number;
    [key: string]: any;
}
export interface CartSessionPayload {
    organization_id: string;
    checkout_campaign_id: string;
    content: Content;
    products?: DetectedProduct[];
    url?: string;
    total?: number;
    id?: string;
    analytics?: string;
    metadata?: {
        sbeSessionId?: string | null;
        shoppingCartId?: string | null;
        sbeRc?: string | null;
        sbeRcDecoded?: string | null;
        bookingShoppingCart?: string | null;
    };
}
export interface CartSessionResponse {
    id: string;
    success: boolean;
    message?: string;
}
export interface OrganizationPipelineInputMapping {
    [fieldName: string]: {
        type: "input" | "button" | "checkbox";
        selector_type: "name" | "id" | "querySelector" | "class" | string;
        selector_value: string;
        default_value?: any;
        mode?: "toggle";
        true_value?: string;
    };
}
export interface OrganizationPipelineCampaign {
    id: string;
    input_mapping: OrganizationPipelineInputMapping;
    button_mapping: {
        selector_type: string;
        selector_value: string;
    };
    additional_properties?: Record<string, any>;
    organization_id: string;
}
export interface OrganizationPipelinePayload {
    [key: string]: any;
    ainternal_pipeline_campaign_id: string;
}
//# sourceMappingURL=index.d.ts.map