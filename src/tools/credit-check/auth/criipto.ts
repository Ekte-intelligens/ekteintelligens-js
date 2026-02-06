import { AuthorizeResponse, CriiptoAuth } from "@criipto/auth-js";

export interface CriiptoConfig {
    domain: string;
    clientId: string;
}

/**
 * Create Criipto auth instance
 */
export const getCriiptoAuth = (
    domain: string,
    clientId: string
): CriiptoAuth => {
    const criiptoAuth = new CriiptoAuth({
        domain,
        clientID: clientId,
        store: sessionStorage,
        acrValues: "urn:grn:authn:no:bankid:substantial",
    });

    return criiptoAuth;
};

/**
 * Open BankID popup for authentication
 */
export const openBankIdPopup = async (
    criiptoAuth: CriiptoAuth
): Promise<AuthorizeResponse> => {
    const result = await criiptoAuth.popup.authorize({
        width: 500,
        height: 600,
        redirectUri: window.location.origin,
        scope: "openid ssn",
    });
    console.log("BankID authentication result:", result);
    return result;
};

/**
 * Open BankID redirect for authentication
 */
export const openBankIdRedirect = async (
    criiptoAuth: CriiptoAuth
): Promise<void> => {
    criiptoAuth.redirect.authorize({
        scope: "openid ssn",
        redirectUri: window.location.origin,
    });
};

/**
 * Match redirect callback and return auth response
 */
export const redirectMatch = async (
    criiptoAuth: CriiptoAuth,
    callback: (authResponse: AuthorizeResponse) => void
): Promise<void> => {
    try {
        const result = await criiptoAuth.redirect.match();
        if (result && result.claims) {
            callback(result);
        }
    } catch (error) {
        console.error("Error occurred while matching redirect", error);
    }
};
