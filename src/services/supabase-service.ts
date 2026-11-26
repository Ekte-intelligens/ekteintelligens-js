import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
    CheckoutCampaign,
    CartSessionPayload,
    CartSessionResponse,
    CartRestoreOutcome,
    CartRestoreSpec,
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
            //Check local storage for ei_test variable and if it is true.
            const eiTest = localStorage.getItem("ei_test");
            const config: {
                is_test?: boolean;
            } = {};
            if (eiTest === "true") {
                config.is_test = true;
            }
            const { data, error } = await this.client.functions.invoke(
                "cart-checkout-session",
                {
                    body: { ...payload, config },
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

    /**
     * Record an assistant event via the `create-event` edge function.
     *
     * The `funnel_subscriber` variant is used for shortlink-open tracking:
     * the function resolves `id_short_encoded` to a funnel subscriber and
     * writes an `opened_link` event for them.
     */
    async createAssistantEvent(
        payload:
            | { id_short_encoded: string; type: "funnel_subscriber" }
            | {
                  id_short_encoded: string;
                  type: "cart_restore";
                  outcome: CartRestoreOutcome;
              },
    ): Promise<boolean> {
        try {
            const { error } = await this.client.functions.invoke(
                "create-event",
                {
                    body: payload,
                }
            );

            if (error) {
                console.error("Error calling create-event function:", error);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error calling create-event function:", error);
            return false;
        }
    }

    /**
     * Read back the restorable part of a cart session (products, session id,
     * our promo code) for the `?s=` id of an abandoned-cart link. The
     * function never returns the session's contact details.
     */
    async getCartRestore(shortId: string): Promise<CartRestoreSpec | null> {
        try {
            const { data, error } = await this.client.functions.invoke(
                "get-checkout-session-restore",
                {
                    body: { id_short_encoded: shortId },
                }
            );

            if (error) {
                console.error(
                    "Error calling get-checkout-session-restore function:",
                    error
                );
                return null;
            }

            const spec = data as CartRestoreSpec | null;
            if (
                !spec ||
                typeof spec.session_id !== "string" ||
                !Array.isArray(spec.products)
            ) {
                return null;
            }
            const text = (value: unknown) =>
                typeof value === "string" ? value : null;
            return {
                ...spec,
                email: text(spec.email),
                phone: text(spec.phone),
                phone_country_code: text(spec.phone_country_code),
            };
        } catch (error) {
            console.error(
                "Error calling get-checkout-session-restore function:",
                error
            );
            return null;
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
