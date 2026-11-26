import { SDKOptions } from '../types';

/**
 * Adds an email field to BookVisit's search box, between the guest picker
 * and the "I have a code" / "Search" row, styled like the guest picker. The
 * email is kept for the browser session and filled into the checkout form
 * once it renders, the way cart restore fills a saved contact.
 *
 * BookVisit re-renders the search box and navigates between steps without
 * a page load, so the page is watched: the field is put back whenever the
 * search box is rendered again, and a checkout email field that appears is
 * filled.
 *
 * Runs only when both `features.searchEmail` and the campaign's
 * `config.bookvisit.search_email` are on.
 */
export declare class SearchEmailTool {
    private static readonly FIELD_ATTRIBUTE;
    private static readonly STORAGE_KEY;
    private static readonly STYLE_ID;
    private static readonly SEARCH_BOX_ID;
    private static readonly SEARCH_BUTTON;
    private static readonly CHECKOUT_PATH;
    /** The guest picker's classes, which BookVisit's stylesheet already has. */
    private static readonly FIELD_CLASS;
    private static readonly INPUT_STYLE;
    private static readonly CSS;
    /** Font Awesome's regular envelope, like the guest picker's user icon. */
    private static readonly ICON;
    private options;
    private supabaseService;
    private prefill;
    /** Kept while off the page, so a typed value survives a re-render. */
    private field?;
    private observer?;
    private filledCheckoutField?;
    private isInitialized;
    constructor(options: SDKOptions);
    initialize(): Promise<boolean>;
    destroy(): void;
    private isEnabled;
    private sync;
    /** Right above the row holding the search button. */
    private placeField;
    /** Each checkout email field BookVisit renders is filled once. */
    private fillCheckout;
    /**
     * Not `type="email"`, so neither our checkout prefill nor BookVisit's
     * form code mistakes it for the checkout email field.
     */
    private createField;
    private storedEmail;
    /** Only a complete address is kept; clearing the field forgets it. */
    private storeEmail;
    private ensureStyle;
}
//# sourceMappingURL=search-email.d.ts.map