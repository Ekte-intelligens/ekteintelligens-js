import { CartRestoreOutcome, SDKOptions } from '../types';

/**
 * Rebuilds an expired BookVisit cart when the visitor returns through an
 * abandoned-cart link (`?s=<id_short_encoded>`).
 *
 * BookVisit's `bv_jwt` session expires after an hour, which empties the
 * basket. This tool reads the stored cart back, searches the same rooms and
 * rate plans for the same dates and guests, adds them to the new basket and
 * continues to checkout with the saved email and phone filled in. Price changes, a
 * promo code we issued, and rooms that are gone are reported in a banner.
 *
 * Runs once per `?s=` id per browser session, and only when both
 * `features.cartRestore` and the campaign's `config.bookvisit.restore` are on.
 */
export declare class CartRestoreTool {
    private static readonly URL_PARAM;
    private static readonly ATTEMPTED_KEY;
    private static readonly NOTICES_KEY;
    private static readonly CONTACT_KEY;
    private static readonly TIMEOUT_MS;
    private static readonly CONTINUE_PATH;
    private static readonly DATE_PATTERN;
    private static readonly LANGUAGE_PREFIX;
    private options;
    private supabaseService;
    private overlay;
    private controller?;
    private isInitialized;
    private lastOutcome?;
    private prefill;
    constructor(options: SDKOptions);
    initialize(): Promise<boolean>;
    getLastOutcome(): CartRestoreOutcome | undefined;
    destroy(): void;
    /** Full navigation, so BookVisit's app boots with the new basket. */
    protected navigate(url: string): void;
    private getRestoreChannelId;
    /**
     * Run the restore under one master timer. On expiry, or when the visitor
     * closes the overlay, every request is aborted and the overlay removed.
     */
    private run;
    private restore;
    /**
     * The rooms of a stored cart, or null when any of them cannot be
     * searched again. Add-ons are not restored.
     */
    private getRestorableRooms;
    private groupByStay;
    /** search-v1 takes `childAges: []`, never null, and no other fields. */
    private toRoomConfig;
    /**
     * Find each room's rate in the search results: same room and rate plan
     * (by id, or by name for carts saved before rate plan ids were stored).
     * Null when any room has no match; a different rate is never picked.
     */
    private matchRooms;
    /**
     * Each searched room config gets its own hitKey per rate, in no
     * particular order, so hits are matched to rooms on their guests.
     */
    private findHit;
    private sameGuests;
    private buildNotices;
    /**
     * Checkout page on this site, keeping the language prefix (`/no/…`) and
     * every query param except `s`.
     */
    private continueUrl;
    private abortable;
    private today;
    private getShortId;
    private getAttemptedIds;
    private markAttempted;
    /** Notices for the page we navigate to, shown once it loads. */
    private storePendingNotices;
    private storePendingContact;
    /** Fill the contact saved by a restore into the checkout form. */
    private fillPendingContact;
    private showPendingNotices;
}
//# sourceMappingURL=cart-restore.d.ts.map