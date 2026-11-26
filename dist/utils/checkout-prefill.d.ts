import { CheckoutContact } from '../types';

/**
 * Fills saved contact details into a checkout form that renders after page
 * load. BookVisit's app renders its form a few seconds in and then resets
 * it, so empty fields are filled again for a while. A field the visitor
 * filled, clicked or typed in is left alone.
 */
export declare class CheckoutPrefill {
    private static readonly WAIT_MS;
    private static readonly CHECK_EVERY_MS;
    private static readonly EMAIL_PATTERN;
    static readonly EMAIL_FIELD = "input[type=\"email\"]";
    private static readonly COUNTRY_CODE_FIELD;
    private static readonly NATIONAL_FIELD;
    private static readonly PHONE_FIELD;
    private stopWaiting?;
    /** Fields the visitor interacted with, or that held a value of theirs. */
    private visitorFields;
    private filledFields;
    /** The usable parts of a stored contact, or null when there are none. */
    static clean(email: string | null | undefined, phone: string | null | undefined, phoneCountryCode: string | null | undefined): CheckoutContact | null;
    fill(contact: CheckoutContact): void;
    destroy(): void;
    private targets;
    private fillTarget;
    /** "+4712345678" with no separate code is kept whole as the number. */
    private splitPhone;
    private find;
    /**
     * Set a value the way typing does, so frameworks that track input
     * state (React's value tracker) see the change.
     */
    private setIfEmpty;
}
//# sourceMappingURL=checkout-prefill.d.ts.map