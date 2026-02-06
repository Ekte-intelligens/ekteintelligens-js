import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
    CreateCreditCheckSessionPayload,
    CreditCheckSession,
    StoraContactDetails,
} from "../types";

/**
 * Create Supabase client using same defaults as SupabaseService
 */
const createSupabaseClient = (
    supabaseUrl?: string,
    supabaseAnonKey?: string
): SupabaseClient => {
    const url =
        supabaseUrl || "https://yoflhmaayrceswiwvxba.supabase.co";
    const key =
        supabaseAnonKey ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZmxobWFheXJjZXN3aXd2eGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI5MzQ4MzUsImV4cCI6MTk4ODUxMDgzNX0.dq8OdZylVnB1Gwa_nYLALxUHk2NOPmRlhS_YbA7E8pg";
    return createClient(url, key);
};

/**
 * Creates a credit check session
 */
export const createCreditCheckSession = async (
    payload: CreateCreditCheckSessionPayload,
    supabaseUrl?: string,
    supabaseAnonKey?: string
): Promise<CreditCheckSession> => {
    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await client.functions.invoke(
        "create-credit-check-session",
        {
            body: payload,
        }
    );

    if (error) {
        console.error("Error creating credit check session:", error);
        throw error;
    }

    if (data.error) {
        throw new Error(data.error);
    }

    return data as CreditCheckSession;
};

/**
 * Gets Stora contact details from a credit check session config
 * Returns null if the session doesn't have Stora integration data
 */
export const getStoraContactFromSession = (
    session: CreditCheckSession
): StoraContactDetails | null => {
    if (
        !session.config ||
        session.config.integration_type !== "stora" ||
        !session.config.integration_meta?.contact
    ) {
        return null;
    }

    return session.config.integration_meta.contact;
};

/**
 * Gets Stora order details from a credit check session config
 * Returns null if the session doesn't have Stora integration data
 */
export const getStoraOrderFromSession = (session: CreditCheckSession): any | null => {
    if (
        !session.config ||
        session.config.integration_type !== "stora" ||
        !session.config.integration_meta?.order
    ) {
        return null;
    }

    return session.config.integration_meta.order;
};

/**
 * Checks if a credit check session has Stora integration
 */
export const hasStoraIntegration = (
    session: CreditCheckSession
): boolean => {
    return (
        session.config?.integration_type === "stora" &&
        !!session.config.integration_meta
    );
};

/**
 * Check existing credit check status for a subscriber
 */
export const checkCreditCheckStatus = async (
    organizationId: string,
    subscriberId: number,
    supabaseUrl?: string,
    supabaseAnonKey?: string
): Promise<CreditCheckSession | null> => {
    try {
        const client = createSupabaseClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await client
            .from("organizations_credit_check_sessions")
            .select("*")
            .eq("organization_id", organizationId)
            .eq("subscriber_id", subscriberId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // If no rows found, that's okay
            if (error.code === "PGRST116") {
                return null;
            }
            console.error("Error checking credit check status:", error);
            throw error;
        }

        return data as CreditCheckSession;
    } catch (error) {
        console.error("Error checking credit check status:", error);
        return null;
    }
};
