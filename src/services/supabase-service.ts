import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
    CheckoutCampaign,
    CartSessionPayload,
    CartSessionResponse,
    OrganizationPipelineCampaign,
    OrganizationPipelinePayload,
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

    async deleteCartSession(sessionId: string): Promise<boolean> {
        try {
            const { error } = await this.client.functions.invoke(
                "delete-checkout-session",
                {
                    body: { session_id: sessionId },
                }
            );

            if (error) {
                console.error(
                    "Error calling delete-cart-session function:",
                    error
                );
                return false;
            }

            console.log("Cart session deleted successfully:", sessionId);
            return true;
        } catch (error) {
            console.error("Error calling delete-cart-session function:", error);
            return false;
        }
    }

    async getPipelineCampaign(
        campaignId: string
    ): Promise<OrganizationPipelineCampaign | null> {
        try {
            const { data, error } = await this.client
                .from("organizations_pipelines_campaigns")
                .select("*")
                .eq("id", campaignId)
                .single();

            if (error) {
                console.error("Error fetching pipeline campaign:", error);
                return null;
            }

            return data as OrganizationPipelineCampaign;
        } catch (error) {
            console.error("Error fetching pipeline campaign:", error);
            return null;
        }
    }

    async runOrganizationPipeline(
        payload: OrganizationPipelinePayload
    ): Promise<boolean> {
        try {
            const { error } = await this.client.functions.invoke(
                "run-organization-pipeline",
                {
                    body: payload,
                }
            );

            if (error) {
                console.error(
                    "Error calling run-organization-pipeline function:",
                    error
                );
                return false;
            }

            console.log("Organization pipeline executed successfully");
            return true;
        } catch (error) {
            console.error(
                "Error calling run-organization-pipeline function:",
                error
            );
            return false;
        }
    }
}
