import {
    getCriiptoAuth,
    openBankIdPopup,
    openBankIdRedirect,
    redirectMatch,
} from "./criipto/index.ts";
import {
    createCreditCheckSession,
    getSessionParamsFromURL,
    getStoraContactFromSession,
    hasStoraIntegration,
    type CreditCheckSession,
    type CreateCreditCheckSessionPayload,
} from "../services/creditCheckSession.ts";

const criiptoAuth = getCriiptoAuth(
    "mediaperformance-test.criipto.id",
    "urn:my:application:identifier:28040"
);

const creditCheckForMockUsers: Record<string, any> = {
    "17906920506": {
        score: 87,
        scoreKarakter: "A",
        scoreBeskrivelse:
            "Din kredittscore er høy, og du har god kredittverdighet.",
        kredittgrense: 100000,
    },
    "14836328710": {
        score: 0,
        scoreKarakter: "D",
        scoreBeskrivelse:
            "Din kredittscore er lav, og du har dårlig kredittverdighet.",
        kredittgrense: 0,
    },
};

/**
 * Creates a credit check session from URL parameters or provided payload
 * Supports both regular and Stora integration flows
 */
export const initializeCreditCheckSession = async (
    payload?: Partial<CreateCreditCheckSessionPayload>
): Promise<CreditCheckSession> => {
    // Get parameters from URL if not provided
    const urlParams = getSessionParamsFromURL();
    const sessionPayload = payload || urlParams;

    if (!sessionPayload || !sessionPayload.organization_id) {
        throw new Error(
            "Missing required parameters: organization_id is required. " +
            "Either provide it in the payload or as a URL parameter."
        );
    }

    // Validate that we have either subscriber_id or integration_subscriber_id
    if (
        !sessionPayload.subscriber_id &&
        !sessionPayload.integration_subscriber_id
    ) {
        throw new Error(
            "Either subscriber_id or integration_subscriber_id must be provided"
        );
    }

    // Create the session
    const session = await createCreditCheckSession(
        sessionPayload as CreateCreditCheckSessionPayload
    );

    return session;
};

/**
 * Initiates BankID authentication and credit check with popup
 * Creates a credit check session first if URL parameters are present
 */
export const initiateIdAndCreditCheck = async () => {
    // Try to create session from URL parameters (for Stora integration)
    let session: CreditCheckSession | null = null;
    try {
        const urlParams = getSessionParamsFromURL();
        if (urlParams && urlParams.organization_id) {
            session = await initializeCreditCheckSession();
            console.log("Credit check session created:", session);

            // If we have Stora integration, log the contact details
            if (hasStoraIntegration(session)) {
                const contact = getStoraContactFromSession(session);
                console.log("Stora contact details:", contact);
            }
        }
    } catch (error) {
        console.warn("Could not create session from URL params:", error);
        // Continue with regular flow if session creation fails
    }

    // Proceed with BankID authentication
    const result = await openBankIdPopup(criiptoAuth);

    // Return mock credit check result (this would be replaced with actual credit check)
    return {
        ...creditCheckForMockUsers[
            result.claims?.socialno ?? "Person not found"
        ],
        session: session, // Include session if created
    };
};

/**
 * Initiates BankID authentication with redirect
 */
export const initiateIdRedirect = async () => {
    await openBankIdRedirect(criiptoAuth);
};

/**
 * Handles BankID redirect callback and initiates credit check
 * Creates a credit check session first if URL parameters are present
 */
export const initiateCreditCheckForRedirect = async (
    callback: (creditCheck: Record<string, any>) => void
) => {
    // Try to create session from URL parameters (for Stora integration)
    let session: CreditCheckSession | null = null;
    try {
        const urlParams = getSessionParamsFromURL();
        if (urlParams && urlParams.organization_id) {
            session = await initializeCreditCheckSession();
            console.log("Credit check session created:", session);

            // If we have Stora integration, log the contact details
            if (hasStoraIntegration(session)) {
                const contact = getStoraContactFromSession(session);
                console.log("Stora contact details:", contact);
            }
        }
    } catch (error) {
        console.warn("Could not create session from URL params:", error);
        // Continue with regular flow if session creation fails
    }

    redirectMatch(criiptoAuth, (authResponse) => {
        const creditCheckResult = {
            ...creditCheckForMockUsers[
                authResponse.claims?.socialno ?? "Person not found"
            ],
            session: session, // Include session if created
        };
        callback(creditCheckResult);
    });
};

/**
 * Helper function to get Stora contact details from a session
 * Useful for accessing contact information when working with Stora integration
 */
export const getStoraContactDetails = (
    session: CreditCheckSession
) => {
    return getStoraContactFromSession(session);
};
