import { CheckoutCampaign, CartSessionPayload, CartSessionResponse } from '../types';

export declare class SupabaseService {
    private client;
    constructor(supabaseUrl?: string, supabaseAnonKey?: string);
    getCheckoutCampaign(campaignId: string): Promise<CheckoutCampaign | null>;
    submitCartSession(payload: CartSessionPayload): Promise<CartSessionResponse | null>;
    deleteCartSession(sessionId: string): Promise<boolean>;
}
//# sourceMappingURL=supabase-service.d.ts.map