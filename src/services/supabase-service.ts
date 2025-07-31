import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
    CheckoutCampaign,
    CartSessionPayload,
    CartSessionResponse,
} from "../types";

export class SupabaseService {
    private client: SupabaseClient;

    constructor(supabaseUrl?: string, supabaseAnonKey?: string) {
        // Use your backend Supabase credentials by default
        const url = supabaseUrl || "https://yoflhmaayrceswiwvxba.supabase.co";
        const key =
            supabaseAnonKey ||
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZmxobWFheXJjZXN3aXd2eGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI5MzQ4MzUsImV4cCI6MTk4ODUxMDgzNX0.dq8OdZylVnB1Gwa_nYLALxUHk2NOPmRlhS_YbA7E8pg";
        this.client = createClient(url, key);
    }

    async getCheckoutCampaign(
        campaignId: string
    ): Promise<CheckoutCampaign | null> {
        try {
            const { data, error } = await this.client
                .from("organizations_checkout_campaigns")
                .select("*")
                .eq("id", campaignId)
                .single();

            if (error) {
                console.error("Error fetching checkout campaign:", error);
                return null;
            }

            return data as CheckoutCampaign;
        } catch (error) {
            console.error("Error fetching checkout campaign:", error);
            return null;
        }
    }

    async submitCartSession(
        payload: CartSessionPayload
    ): Promise<CartSessionResponse | null> {
        try {
            const { data, error } = await this.client.functions.invoke(
                "cart-checkout-session",
                {
                    body: payload,
                }
            );

            if (error) {
                console.error(
                    "Error calling cart-checkout-session function:",
                    error
                );
                return null;
            }

            return data as CartSessionResponse;
        } catch (error) {
            console.error(
                "Error calling cart-checkout-session function:",
                error
            );
            return null;
        }
    }
}
