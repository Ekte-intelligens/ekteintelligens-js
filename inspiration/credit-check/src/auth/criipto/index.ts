import { AuthorizeResponse, CriiptoAuth } from "@criipto/auth-js";

export const getCriiptoAuth = (domain: string, clientId: string) => {
    const criiptoAuth = new CriiptoAuth({
        domain,
        clientID: clientId,
        store: sessionStorage,
        acrValues: "urn:grn:authn:no:bankid:substantial",
    });

    return criiptoAuth;
};

export const openBankIdPopup = async (criiptoAuth: CriiptoAuth) => {
    const result = await criiptoAuth.popup.authorize({
        width: 500,
        height: 600,
        redirectUri: window.location.origin,
        scope: "openid ssn",
    });
    console.log(result, result.claims);
    return result;
};

export const openBankIdRedirect = async (criiptoAuth: CriiptoAuth) => {
    criiptoAuth.redirect.authorize({
        scope: "openid ssn",
        redirectUri: window.location.origin,
    });
};

export const redirectMatch = async (
    criiptoAuth: CriiptoAuth,
    callback: (authResponse: AuthorizeResponse) => void
) => {
    try {
        const result = await criiptoAuth.redirect.match();
        if (result && result.claims) {
            callback(result);
        }
    } catch (error) {
        console.error("Error occured while matching redirect", error);
    }
};
