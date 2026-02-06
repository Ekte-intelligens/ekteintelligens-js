export interface StoraCreditCheckConfig {
    organization_id: string;
    integration_type: "stora";
    integration_subscriber_id?: string;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
}

export interface CreateCreditCheckSessionPayload {
    organization_id: string;
    subscriber_id?: number;
    integration_subscriber_id?: string;
    integration_type?: "stora";
    integration_meta?: {
        order_id?: string;
    };
    email?: string;
}

export interface CreditCheckSession {
    id: string;
    created_at: string;
    organization_id: string;
    subscriber_id: number;
    config: {
        integration_type?: "stora";
        integration_subscriber_id?: string;
        integration_meta?: {
            order_id?: string;
            order?: any;
            contact?: {
                id: string;
                email?: string;
                phone?: string;
                first_name?: string;
                last_name?: string;
                [key: string]: any;
            };
        };
    } | null;
    status: string;
}

export interface StoraContactDetails {
    id: string;
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    [key: string]: any;
}

export interface CreditCheckDialogOptions {
    organizationId: string;
    onCreditCheckComplete?: (session: CreditCheckSession) => void;
    onError?: (error: Error) => void;
}
