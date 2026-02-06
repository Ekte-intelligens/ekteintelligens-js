import { AuthorizeResponse, CriiptoAuth } from '@criipto/auth-js';

export interface CriiptoConfig {
    domain: string;
    clientId: string;
}
/**
 * Create Criipto auth instance
 */
export declare const getCriiptoAuth: (domain: string, clientId: string) => CriiptoAuth;
/**
 * Open BankID popup for authentication
 */
export declare const openBankIdPopup: (criiptoAuth: CriiptoAuth) => Promise<AuthorizeResponse>;
/**
 * Open BankID redirect for authentication
 */
export declare const openBankIdRedirect: (criiptoAuth: CriiptoAuth) => Promise<void>;
/**
 * Match redirect callback and return auth response
 */
export declare const redirectMatch: (criiptoAuth: CriiptoAuth, callback: (authResponse: AuthorizeResponse) => void) => Promise<void>;
//# sourceMappingURL=criipto.d.ts.map