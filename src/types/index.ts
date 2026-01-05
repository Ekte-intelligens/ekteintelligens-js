export interface SDKOptions {
    organizationId: string;
    checkoutCampaignId: string;
    pipelineCampaignId?: string;
    supabaseUrl?: string; // Optional - will use your backend by default
    supabaseAnonKey?: string; // Optional - will use your backend by default
    features?: {
        abandonedCart?: boolean;
        organizationPipeline?: boolean;
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
    average_checkout_value?: number;
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

export interface OrganizationPipelineInputMapping {
    [fieldName: string]: {
        type: "input" | "button" | "checkbox";
        selector_type: "name" | "id" | "querySelector" | "class" | string;
        selector_value: string;
        default_value?: any;
        mode?: "toggle";
        true_value?: string; // For checkbox type: value that represents true
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
