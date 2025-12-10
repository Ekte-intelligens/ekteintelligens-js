import { CheckoutCampaign, CartSessionPayload, CartSessionResponse, OrganizationPipelineCampaign, OrganizationPipelinePayload } from '../types';

export declare class SupabaseService {
    private client;
    constructor(supabaseUrl?: string, supabaseAnonKey?: string);
    getCheckoutCampaign(campaignId: string): Promise<CheckoutCampaign | null>;
    submitCartSession(payload: CartSessionPayload): Promise<CartSessionResponse | null>;
    deleteCartSession(sessionId: string): Promise<boolean>;
    getPipelineCampaign(campaignId: string): Promise<OrganizationPipelineCampaign | null>;
    runOrganizationPipeline(payload: OrganizationPipelinePayload): Promise<boolean>;
}
//# sourceMappingURL=supabase-service.d.ts.map