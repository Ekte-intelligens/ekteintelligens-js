import {
    getCriiptoAuth,
    openBankIdPopup,
    type CriiptoConfig,
} from "./criipto";
import {
    getStoraContactFromSession,
    hasStoraIntegration,
} from "../services/credit-check-session";
import type {
    CreditCheckSession,
} from "../types";

/**
 * Initiates BankID authentication and credit check with popup
 * Creates a credit check session first if provided
 */
export const initiateIdAndCreditCheck = async (
    session: CreditCheckSession | null,
    criiptoConfig: CriiptoConfig
): Promise<{ session: CreditCheckSession | null; claims?: any }> => {
    // Create Criipto auth instance
    const criiptoAuth = getCriiptoAuth(
        criiptoConfig.domain,
        criiptoConfig.clientId
    );

    // Proceed with BankID authentication
    const result = await openBankIdPopup(criiptoAuth);

    // If we have a session, log contact details if it's a Stora integration
    if (session && hasStoraIntegration(session)) {
        const contact = getStoraContactFromSession(session);
        console.log("Stora contact details:", contact);
    }

    // Return result with session
    return {
        session: session,
        claims: result.claims,
    };
};
