/**
 * Stay-search capture: the check-in / check-out dates a visitor searched for.
 *
 * Booking engines such as Elina PMS (Norgesbooking) put the stay in the URL of
 * the listing pages (`?from=12/27/2026&to=01/03/2027&start=27/12/2026&end=
 * 03/01/2027`) but not on the booking page where the cart is captured. This
 * module remembers the latest stay seen in any URL so the cart upload can
 * carry it: as `startDate`/`endDate`/`nights` on product rows that have none,
 * and as `ei_stay` inside the analytics payload.
 *
 * Consent: the latest stay is always kept in memory (reading the URL touches
 * nothing on the device). Persisting it to localStorage goes through the same
 * gate as attribution persistence — never after an explicit refusal, and
 * under `requireConsent` only once consent is granted. Stored stays expire
 * after 7 days and are cleared when a checkout completes.
 */
export interface StayParams {
    /** YYYY-MM-DD */
    checkin: string;
    /** YYYY-MM-DD */
    checkout: string;
    adults?: number;
    children?: number;
    /** ISO timestamp of the page view the stay was read from. */
    captured_at: string;
    /** origin + pathname of that page (no query). */
    url: string;
}
export declare const STAY_STORAGE_KEY = "ei_stay_params";
export declare const STAY_MAX_AGE_MS: number;
/** Window for writing the stay onto product rows (e-mail accuracy). */
export declare const PRODUCT_STAY_MAX_AGE_MS: number;
/**
 * Parse one date value. Returns every reading that is a valid date: an
 * unambiguous value yields one, "03/01/2027" yields two (3 Jan and 1 Mar).
 * The order of the result follows `prefer`.
 */
export declare function parseDateCandidates(raw: string, prefer: "MDY" | "DMY"): string[];
/**
 * Read the stay from a URL's query string. Every known key pair is read; when
 * more than one pair is present the readings that agree win, which is how the
 * ambiguous Elina pair (`from`/`to` US order, `start`/`end` Norwegian order)
 * is resolved. Null when no valid stay is present.
 */
export declare function parseStayFromUrl(href: string): StayParams | null;
/** Fold the current page's URL into the remembered stay. */
export declare function captureStayFromCurrentPage(): StayParams | null;
/**
 * Start capturing: reads the current page now and again on history
 * navigation. `enabled: false` (features.stayCapture) turns the whole module
 * off — nothing is read, stored or attached.
 */
export declare function startStayCapture(opts?: {
    enabled?: boolean;
}): void;
/**
 * The stay to attach to a cart: the current page's URL first, then what this
 * page view captured, then a stored one from an earlier page (within 7 days).
 */
export declare function getCurrentStay(): StayParams | null;
/** Forget the stay — called when a checkout completes. */
export declare function clearStay(): void;
/** Test hook: reset module state. */
export declare function _resetStayCaptureForTests(): void;
/**
 * Fill `startDate` / `endDate` / `nights` on product rows that carry none,
 * from the captured stay. Rows that already have dates (BookVisit, SynXis)
 * are left untouched. Returns the same array when nothing changed.
 */
export declare function applyStayToProducts<T extends Record<string, any>>(products: T[], stay: StayParams | null, 
/**
 * Only a stay captured within this window is written onto products: the
 * dates end up in reminder e-mails to the guest, where a search from
 * days ago would be wrong. The stay still travels as `ei_stay` for
 * reporting regardless.
 */
maxAgeMs?: number): T[];
//# sourceMappingURL=stay-capture.d.ts.map