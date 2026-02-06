import { CreditCheckSession, CreditCheckDialogOptions } from '../types';
import { CriiptoConfig } from '../auth/criipto';

/**
 * Create and show credit check dialog
 */
export declare const createCreditCheckDialog: (options: CreditCheckDialogOptions & {
    criiptoConfig: CriiptoConfig;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    session?: CreditCheckSession | null;
}) => HTMLElement;
/**
 * Show credit check dialog in booking complete section
 */
export declare const showCreditCheckDialog: (bookingCompleteSection: HTMLElement, options: CreditCheckDialogOptions & {
    criiptoConfig: CriiptoConfig;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    session?: CreditCheckSession | null;
}) => void;
//# sourceMappingURL=dialog.d.ts.map