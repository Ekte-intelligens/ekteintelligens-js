import { CheckoutCampaign, CartSessionPayload, CartSessionResponse, CartRestoreOutcome, CartRestoreSpec, OrganizationPipelineCampaign, OrganizationPipelinePayload } from '../types';

export declare class SupabaseService {
    private client;
    constructor(supabaseUrl?: string, supabaseAnonKey?: string);
    getCheckoutCampaign(campaignId: string): Promise<CheckoutCampaign | null>;
    submitCartSession(payload: CartSessionPayload): Promise<CartSessionResponse | null>;
    deleteCartSession(sessionId: string): Promise<boolean>;
    /**
     * Record an assistant event via the `create-event` edge function.
     *
     * The `funnel_subscriber` variant is used for shortlink-open tracking:
     * the function resolves `id_short_encoded` to a funnel subscriber and
     * writes an `opened_link` event for them.
     */
    createAssistantEvent(payload: {
        id_short_encoded: string;
        type: "funnel_subscriber";
    } | {
        id_short_encoded: string;
        type: "cart_restore";
        outcome: CartRestoreOutcome;
    }): Promise<boolean>;
    /**
     * Read back the restorable part of a cart session (products, session id,
     * our promo code) for the `?s=` id of an abandoned-cart link. The
     * function never returns the session's contact details.
     */
    getCartRestore(shortId: string): Promise<CartRestoreSpec | null>;
    getPipelineCampaign(campaignId: string): Promise<OrganizationPipelineCampaign | null>;
    runOrganizationPipeline(payload: OrganizationPipelinePayload): Promise<boolean>;
}
//# sourceMappingURL=supabase-service.d.ts.map