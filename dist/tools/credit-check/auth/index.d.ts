import { CriiptoConfig } from './criipto';
import { CreditCheckSession } from '../types';

/**
 * Initiates BankID authentication and credit check with popup
 * Creates a credit check session first if provided
 */
export declare const initiateIdAndCreditCheck: (session: CreditCheckSession | null, criiptoConfig: CriiptoConfig) => Promise<{
    session: CreditCheckSession | null;
    claims?: any;
}>;
//# sourceMappingURL=index.d.ts.map