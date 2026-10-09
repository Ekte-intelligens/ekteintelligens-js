import { SDKOptions } from '../types';

export declare class AbandonedCartTool {
    private options;
    private supabaseService;
    private inputDetector?;
    private productDetector?;
    private totalExtractor?;
    private campaign?;
    private totalAverage;
    private _sessionId?;
    private isInitialized;
    private previousContent;
    private previousProducts;
    private previousTotal;
    private debounceTimer?;
    private pendingContentUpdate?;
    private isSubmitting;
    private autofieldSection?;
    private autofieldWrappers;
    private autofieldObserver?;
    constructor(options: SDKOptions);
    initialize(): Promise<boolean>;
    /**
     * Debounced version of handleContentUpdate to prevent multiple rapid calls
     * from auto-fill operations from creating multiple session IDs
     */
    private debouncedHandleContentUpdate;
    private handleContentUpdate;
    /**
     * Add the captured stay to the analytics JSON as `ei_stay`, next to
     * `enhanced_insights`. Only when analytics is being sent at all (consent),
     * so the stay never travels on its own.
     */
    private withStay;
    /**
     * The submission lock is held while the basket is fetched, so a basket
     * request that hangs must not hold it indefinitely. On timeout the update
     * goes out without basket data — the same path as a failed basket fetch.
     */
    private withBasketTimeout;
    private static readonly BASKET_FETCH_TIMEOUT_MS;
    private hasContentChanged;
    destroy(): void;
    getContent(): Record<string, any>;
    hasEmailOrPhone(): boolean;
    getSessionId(): string | undefined;
    /**
     * Reset the change tracking to force the next update to be uploaded
     * Useful for testing or when you want to ensure the latest data is uploaded
     */
    resetChangeTracking(): void;
    /**
     * Load session ID from localStorage
     */
    private loadSessionIdFromStorage;
    /**
     * Save session ID to localStorage
     */
    private saveSessionIdToStorage;
    /**
     * Clear session ID from localStorage
     */
    private clearSessionIdFromStorage;
    /**
     * Handle completed checkout by deleting the session from database and clearing localStorage
     */
    private handleCompletedCheckout;
    /**
     * Fetch basket data from BookVisit API
     */
    private fetchBookVisitBasket;
    /**
     * Identifiers of a BookVisit basket: the basket/booking id from the API
     * response (field names differ between API versions, so several are
     * tried), plus `sbe_rc`/`basketId` from the page URL when present.
     * Never throws; null when nothing was found.
     */
    private getBookVisitSessionIds;
    /**
     * Extract products and total from BookVisit API response
     */
    private extractBookVisitProductsAndTotal;
    /**
     * Inject autofields for BookVisit campaigns
     */
    private injectBookVisitAutofields;
    /**
     * Stop keeping our autofields in sync with the page
     */
    private stopSyncingAutofields;
    /**
     * Put each of our autofields on the page when BookVisit does not render
     * its own version of it, and take it off when BookVisit does
     */
    private syncAutofields;
    /**
     * Selectors that identify each autofield, whether rendered by BookVisit
     * itself or injected by us.
     */
    private static readonly AUTOFIELD_SELECTORS;
    /**
     * Check whether BookVisit itself renders an input for the given autofield,
     * ignoring the ones we injected
     */
    private nativeAutofieldExists;
    /**
     * Determine which fields to include based on input_mapping
     */
    private getFieldsToInclude;
    /**
     * Check if any of the target field names exist in the field mappings
     * The values (not keys) represent the system mappings (first_name, last_name, phone_number, email)
     */
    private hasFieldMapping;
    /**
     * Check if any of the target field names exist in the input selectors
     */
    private hasInputSelector;
    /**
     * Get the user's locale from browser settings
     */
    private getUserLocale;
    /**
     * Get localized text for email and phone number fields
     */
    private getLocalizedText;
    /**
     * Create the BookVisit form section HTML
     */
    private createBookVisitFormSection;
    /**
     * Fetch basket data from SynXis cart API with dataLayer fallback
     */
    private fetchSynxisBasket;
    /**
     * Fetch basket data from SynXis cart REST API
     */
    private fetchSynxisCartApi;
    /**
     * Extract products and total from SynXis cart API response
     *
     * The /gw/v1/cart/ endpoint can return multiple pending reservations under
     * the same shoppingCartId cookie (accumulated from prior incomplete bookings).
     * We filter down to the reservation the user is actually checking out, matched
     * via the sbe_rc URL param (base64 UUID = reservation.id). Fallback: the
     * reservation with the highest itineraryNumber (most recently created).
     *
     * The API's Total.Amount is the list price, which doesn't reflect promo
     * discounts that the SBE applies client-side at reservation time. The root
     * `total` is picked in this order:
     *   1. the reservation captured from the SBE's own createReservation
     *      response (post-discount, see installSynxisReservationCapture)
     *   2. selectSynxisTotal(): the API total, or the DOM-visible price when it
     *      looks like a plausible promo on it
     * The DOM price is also exposed per-product as `actualTotal` for reference.
     *
     * Possible future fallback: the SBE's Redux store holds the same figure at
     * reservation.byId[<id>].Prices.Total.Total, but reaching it goes through
     * React internals, so it is deliberately not read here.
     */
    private extractSynxisCartApiData;
    /**
     * Pick the root total from the cart API sum and the DOM-visible price.
     *
     * The API total is the list price and the default. The DOM price is
     * post-discount but parsed from locale-formatted text, so it only wins
     * when it looks like a plausible promo on the API total: above zero, no
     * higher than the API total (a promo never raises the price) and not cut
     * by half or more. Anything else is logged and ignored. With no API total
     * we take the DOM price, then the campaign average.
     */
    private selectSynxisTotal;
    /**
     * Wrap window.fetch and XMLHttpRequest so the SBE's createReservation
     * response can be read as it goes past. The fetch Response is cloned and
     * the XHR body is read after loadend; the page's own handling is never
     * touched and nothing in here may throw. Installed once per page and only
     * useful when the script also runs on the room-selection page. With
     * nothing captured, extractSynxisCartApiData() silently falls back.
     */
    private installSynxisReservationCapture;
    private isSynxisCreateReservationUrl;
    private readSynxisReservationResponse;
    /**
     * Pull { id, total, originalTotal, currency } out of a createReservation
     * response and keep it in memory + sessionStorage. The reservation may sit
     * at the root or inside a wrapper (e.g. Reservations[0]), so the node is
     * searched for rather than addressed. The first response's shape is logged
     * once so the real layout can be confirmed on a live checkout.
     */
    private captureSynxisReservationResponse;
    /**
     * Find the first object that looks like a reservation (has an Id and
     * Prices.Total.Total), searching a few levels into wrappers and arrays.
     */
    private findSynxisReservationNode;
    /**
     * Captured reservation by id: memory first, then the sessionStorage copy
     * written on the room-selection page.
     */
    private getCapturedSynxisReservation;
    /**
     * Read the cart total as rendered on the SynXis checkout page.
     * Accounts for promo/discount adjustments applied client-side that
     * aren't reflected in the /gw/v1/cart/ API response.
     */
    private getSynxisActualTotal;
    /**
     * Parse a locale-formatted price string like "12 980,50 kr", "NOK 3,310"
     * or "12,980.50 kr". See parseLocalizedNumber for the separator rules.
     */
    private parseSynxisPrice;
    /**
     * Parse a locale-formatted number. Everything but digits, ".", "," and
     * "-" is dropped first (currency codes, nbsp, narrow nbsp). With both "."
     * and "," present the rightmost one is the decimal mark. With only one
     * kind present it is a thousands separator when it occurs more than once
     * or when exactly three digits follow it ("3,310" is 3310, not 3.31);
     * otherwise it is the decimal mark ("980,5", "980.50").
     */
    private parseLocalizedNumber;
    /**
     * Get SynXis session identifiers from cookies and URL parameters
     */
    private getSynxisSessionIds;
    /**
     * Get SynXis-related entries from window.dataLayer (fallback)
     */
    private getSynxisDataLayer;
    /**
     * Extract products and total from SynXis dataLayer entries (fallback)
     */
    private extractSynxisProductsFromDataLayer;
    /**
     * Read basket data from an Elina PMS booking page (e.g. /Confirm/SignUpOnBooking).
     * Elina exposes everything we need directly in the DOM — no API call required.
     * Returns null if cart elements aren't on the page, so totalAverage is used instead.
     */
    private fetchElinapmsBasket;
    /**
     * Stay dates from an Elina element (or the document): the element's own
     * data-startdate/enddate, else the first descendant that carries them.
     * Only ISO dates are accepted; nights is computed when absent.
     */
    private readElinapmsStay;
    /**
     * Resolve the booking total from the Elina PMS booking page.
     * Prefers the hidden #Total form input (the value posted on submit).
     * Falls back to summing accommodation base + fees + addons, mirroring the
     * Elina dataLayer script used for begin_checkout tracking.
     */
    private extractElinapmsTotal;
    /**
     * Read Elina PMS / Norgesbooking session identifiers from cookies.
     * bookingShoppingCart_0 is a server-side cart GUID; the browser sending
     * this cookie to /Confirm/SignUpOnBooking re-renders the original cart.
     */
    private getElinapmsSessionIds;
    /**
     * Parse a number string from the Elina PMS DOM. Handles both European
     * ("2 840,00" or "2&nbsp;840,00") and US ("2,840.00" and "2,840") formats,
     * see parseLocalizedNumber for the separator rules. Unparseable input is 0.
     */
    private parseElinapmsNumber;
    /**
     * Get cookie value by name
     */
    private getCookie;
    /**
     * Set up autofield listeners with retry logic
     * This ensures both InputDetector listeners and sessionStorage listeners are attached
     */
    private setupAutofieldListenersWithRetry;
    /**
     * Add direct listeners to autofields to ensure they're detected by InputDetector
     * This is necessary because InputDetector might use specific selectors that don't match autofields
     */
    private addDirectAutofieldListeners;
    private readonly boundHandleAutofieldBlur;
    /**
     * Handle blur event on autofield inputs
     * Manually triggers the content update callback to ensure autofields are detected
     */
    private handleAutofieldBlur;
    /**
     * sessionStorage key for each autofield input name
     */
    private static readonly AUTOFIELD_STORAGE_KEYS;
    private readonly boundSaveAutofieldToStorage;
    /**
     * Set up event listeners on autofield inputs to store values in sessionStorage
     */
    private setupAutofieldStorageListeners;
    /**
     * Check if we're on the payment page and fill in fields from sessionStorage
     */
    private checkAndFillPaymentPageFields;
    /**
     * Fill in payment page fields from sessionStorage
     * Handles both main document and iframe scenarios
     */
    private fillPaymentPageFields;
    /**
     * Try to send data to cross-origin iframe using postMessage
     * Attempts multiple message formats in case the iframe uses different conventions
     */
    private tryPostMessageToIframe;
    /**
     * Try to pass data via URL parameters if the iframe src can be modified
     * This only works if the iframe hasn't loaded yet or can be reloaded
     */
    private tryIframeUrlParameters;
    /**
     * Set up a MutationObserver to watch for dynamically added iframes
     */
    private setupIframeWatcher;
    /**
     * Save value to sessionStorage
     */
    private saveToSessionStorage;
    /**
     * Get value from sessionStorage
     */
    private getFromSessionStorage;
    /**
     * Set up listener for URL changes (for SPA navigation)
     */
    private setupUrlChangeListener;
}
//# sourceMappingURL=abandoned-cart.d.ts.map