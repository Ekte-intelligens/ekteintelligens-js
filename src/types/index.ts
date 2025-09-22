export interface SDKOptions {
    organizationId: string;
    checkoutCampaignId: string;
    supabaseUrl?: string; // Optional - will use your backend by default
    supabaseAnonKey?: string; // Optional - will use your backend by default
    features?: {
        abandonedCart?: boolean;
    };
    config?: {
        completedCheckout?: boolean;
    };
}

export interface InputMapping {
    form_selector?: string;
    inputs?: string[];
    field_mappings?: Record<string, string>; // Map from user field names to internal field names
}

export interface ProductMapping {
    [key: string]: any;
}

export interface CheckoutCampaign {
    id: string;
    product_mapping: ProductMapping;
    input_mapping: InputMapping | null;
    total_selector?: string; // Selector for cart total (id, class, or complex selector)
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
    url?: string; // Current page URL with query parameters
    total?: number; // Cart total value
    id?: string;
}

export interface CartSessionResponse {
    id: string;
    success: boolean;
    message?: string;
}
