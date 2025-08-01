export interface SDKOptions {
    organizationId: string;
    cartCampaignId: string;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    features?: {
        abandonedCart?: boolean;
    };
}
export interface InputMapping {
    form_selector?: string;
    inputs?: string[];
}
export interface ProductMapping {
    [key: string]: any;
}
export interface CheckoutCampaign {
    id: string;
    product_mapping: ProductMapping;
    input_mapping: InputMapping | null;
    total_selector?: string;
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
    cart_campaign_id: string;
    content: Content;
    products?: DetectedProduct[];
    url?: string;
    total?: number;
    id?: string;
}
export interface CartSessionResponse {
    id: string;
    success: boolean;
    message?: string;
}
//# sourceMappingURL=index.d.ts.map