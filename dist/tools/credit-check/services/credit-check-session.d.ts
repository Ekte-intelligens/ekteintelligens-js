import { CreateCreditCheckSessionPayload, CreditCheckSession, StoraContactDetails } from '../types';

/**
 * Creates a credit check session
 */
export declare const createCreditCheckSession: (payload: CreateCreditCheckSessionPayload, supabaseUrl?: string, supabaseAnonKey?: string) => Promise<CreditCheckSession>;
/**
 * Gets Stora contact details from a credit check session config
 * Returns null if the session doesn't have Stora integration data
 */
export declare const getStoraContactFromSession: (session: CreditCheckSession) => StoraContactDetails | null;
/**
 * Gets Stora order details from a credit check session config
 * Returns null if the session doesn't have Stora integration data
 */
export declare const getStoraOrderFromSession: (session: CreditCheckSession) => any | null;
/**
 * Checks if a credit check session has Stora integration
 */
export declare const hasStoraIntegration: (session: CreditCheckSession) => boolean;
/**
 * Check existing credit check status for a subscriber
 */
export declare const checkCreditCheckStatus: (organizationId: string, subscriberId: number, supabaseUrl?: string, supabaseAnonKey?: string) => Promise<CreditCheckSession | null>;
//# sourceMappingURL=credit-check-session.d.ts.map