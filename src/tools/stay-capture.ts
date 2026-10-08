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

import {
    isAnalyticsConsentGranted,
    onAnalyticsConsentChange,
} from "../utils/analytics-collector";

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

export const STAY_STORAGE_KEY = "ei_stay_params";
export const STAY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** Window for writing the stay onto product rows (e-mail accuracy). */
export const PRODUCT_STAY_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const MAX_NIGHTS = 60;
const MS_PER_DAY = 86_400_000;

// [checkin key, checkout key, preferred order when the day/month is ambiguous]
type Pair = [string, string, "MDY" | "DMY"];
const PAIRS: Pair[] = [
    ["from", "to", "MDY"], // Elina listing pages: US order
    ["start", "end", "DMY"], // Elina listing pages: Norwegian order
    ["checkin", "checkout", "DMY"],
    ["check_in", "check_out", "DMY"],
    ["arrival", "departure", "DMY"],
    ["fromDate", "toDate", "DMY"],
    ["startDate", "endDate", "DMY"],
];

let enabled = true;
let memoryStay: StayParams | null = null;
let consentListenerAttached = false;
let popstateAttached = false;

const pad = (n: number) => (n < 10 ? "0" + n : String(n));

function toIsoDate(y: number, m: number, d: number): string | null {
    if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
    const date = new Date(Date.UTC(y, m - 1, d));
    if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
    return `${y}-${pad(m)}-${pad(d)}`;
}

/**
 * Parse one date value. Returns every reading that is a valid date: an
 * unambiguous value yields one, "03/01/2027" yields two (3 Jan and 1 Mar).
 * The order of the result follows `prefer`.
 */
export function parseDateCandidates(
    raw: string,
    prefer: "MDY" | "DMY"
): string[] {
    const value = raw.trim();
    let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/.exec(value);
    if (m) {
        const iso = toIsoDate(+m[1]!, +m[2]!, +m[3]!);
        return iso ? [iso] : [];
    }
    m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(value);
    if (!m) return [];
    const a = +m[1]!;
    const b = +m[2]!;
    const y = +m[3]!;
    const separator = value.charAt(m[1]!.length);
    // A dot is only ever the Norwegian day.month.year form.
    if (separator === ".") {
        const iso = toIsoDate(y, b, a);
        return iso ? [iso] : [];
    }
    const dmy = toIsoDate(y, b, a);
    const mdy = toIsoDate(y, a, b);
    const out: string[] = [];
    const ordered = prefer === "DMY" ? [dmy, mdy] : [mdy, dmy];
    for (const candidate of ordered) {
        if (candidate && out.indexOf(candidate) === -1) out.push(candidate);
    }
    return out;
}

function nightsBetween(checkin: string, checkout: string): number {
    const [y1, m1, d1] = checkin.split("-").map(Number);
    const [y2, m2, d2] = checkout.split("-").map(Number);
    return Math.round(
        (Date.UTC(y2!, m2! - 1, d2!) - Date.UTC(y1!, m1! - 1, d1!)) /
            MS_PER_DAY
    );
}

const validStay = (checkin: string, checkout: string): boolean => {
    const nights = nightsBetween(checkin, checkout);
    return nights >= 1 && nights <= MAX_NIGHTS;
};

const asCount = (raw: string | null): number | undefined => {
    if (raw == null) return undefined;
    const n = Number(raw.trim());
    return Number.isInteger(n) && n >= 0 && n <= 99 ? n : undefined;
};

/**
 * Read the stay from a URL's query string. Every known key pair is read; when
 * more than one pair is present the readings that agree win, which is how the
 * ambiguous Elina pair (`from`/`to` US order, `start`/`end` Norwegian order)
 * is resolved. Null when no valid stay is present.
 */
export function parseStayFromUrl(href: string): StayParams | null {
    let url: URL;
    try {
        url = new URL(href);
    } catch {
        return null;
    }
    const params = url.searchParams;

    const readings: { checkin: string; checkout: string }[][] = [];
    for (const [inKey, outKey, prefer] of PAIRS) {
        const inRaw = params.get(inKey);
        const outRaw = params.get(outKey);
        if (!inRaw || !outRaw) continue;
        const ins = parseDateCandidates(inRaw, prefer);
        const outs = parseDateCandidates(outRaw, prefer);
        const combos: { checkin: string; checkout: string }[] = [];
        for (const checkin of ins) {
            for (const checkout of outs) {
                if (validStay(checkin, checkout)) {
                    combos.push({ checkin, checkout });
                }
            }
        }
        if (combos.length > 0) readings.push(combos);
    }
    if (readings.length === 0) return null;

    let chosen: { checkin: string; checkout: string } | null = null;
    if (readings.length > 1) {
        // A stay that another key pair also reads is the right one.
        outer: for (const combos of readings) {
            for (const combo of combos) {
                const agreed = readings.some(
                    (other) =>
                        other !== combos &&
                        other.some(
                            (o) =>
                                o.checkin === combo.checkin &&
                                o.checkout === combo.checkout
                        )
                );
                if (agreed) {
                    chosen = combo;
                    break outer;
                }
            }
        }
    }
    // Otherwise the first pair's preferred reading.
    if (!chosen) chosen = readings[0]![0]!;

    const stay: StayParams = {
        checkin: chosen.checkin,
        checkout: chosen.checkout,
        captured_at: new Date().toISOString(),
        url: url.origin + url.pathname,
    };
    const adults = asCount(params.get("adults"));
    const children = asCount(params.get("children"));
    const guests = asCount(params.get("guests"));
    if (adults !== undefined) stay.adults = adults;
    else if (guests !== undefined) stay.adults = guests;
    if (children !== undefined) stay.children = children;
    return stay;
}

const isFresh = (stay: StayParams, now = Date.now()): boolean => {
    const at = Date.parse(stay.captured_at);
    return Number.isFinite(at) && now - at >= 0 && now - at <= STAY_MAX_AGE_MS;
};

function readStoredStay(): StayParams | null {
    try {
        if (typeof window === "undefined" || !window.localStorage) return null;
        const raw = window.localStorage.getItem(STAY_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (
            !parsed ||
            typeof parsed !== "object" ||
            typeof parsed.checkin !== "string" ||
            typeof parsed.checkout !== "string" ||
            typeof parsed.captured_at !== "string"
        ) {
            return null;
        }
        const stay = parsed as StayParams;
        if (!isFresh(stay) || !validStay(stay.checkin, stay.checkout)) {
            window.localStorage.removeItem(STAY_STORAGE_KEY);
            return null;
        }
        return stay;
    } catch {
        return null;
    }
}

function persistStay(): void {
    if (typeof window === "undefined" || !memoryStay) return;
    if (!isAnalyticsConsentGranted()) return;
    try {
        window.localStorage?.setItem(
            STAY_STORAGE_KEY,
            JSON.stringify(memoryStay)
        );
    } catch {
        /* privacy mode / quota — best-effort */
    }
}

function removeStoredStay(): void {
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.removeItem(STAY_STORAGE_KEY);
        }
    } catch {
        /* ignore */
    }
}

/** Fold the current page's URL into the remembered stay. */
export function captureStayFromCurrentPage(): StayParams | null {
    if (!enabled || typeof window === "undefined") return null;
    try {
        const stay = parseStayFromUrl(window.location.href);
        if (stay) {
            memoryStay = stay;
            persistStay();
        }
        return stay;
    } catch {
        return null;
    }
}

/**
 * Start capturing: reads the current page now and again on history
 * navigation. `enabled: false` (features.stayCapture) turns the whole module
 * off — nothing is read, stored or attached.
 */
export function startStayCapture(opts?: { enabled?: boolean }): void {
    enabled = opts?.enabled !== false;
    if (!enabled || typeof window === "undefined") return;
    captureStayFromCurrentPage();
    if (!popstateAttached) {
        popstateAttached = true;
        try {
            window.addEventListener("popstate", () => {
                captureStayFromCurrentPage();
            });
        } catch {
            /* ignore */
        }
    }
    if (!consentListenerAttached) {
        consentListenerAttached = true;
        onAnalyticsConsentChange((granted) => {
            if (granted) persistStay();
            else removeStoredStay();
        });
    }
}

/**
 * The stay to attach to a cart: the current page's URL first, then what this
 * page view captured, then a stored one from an earlier page (within 7 days).
 */
export function getCurrentStay(): StayParams | null {
    if (!enabled) return null;
    const fromPage = captureStayFromCurrentPage();
    if (fromPage) return fromPage;
    if (memoryStay && isFresh(memoryStay)) return memoryStay;
    const stored = readStoredStay();
    if (stored) memoryStay = stored;
    return stored;
}

/** Forget the stay — called when a checkout completes. */
export function clearStay(): void {
    memoryStay = null;
    removeStoredStay();
}

/** Test hook: reset module state. */
export function _resetStayCaptureForTests(): void {
    enabled = true;
    memoryStay = null;
    removeStoredStay();
}

/**
 * Fill `startDate` / `endDate` / `nights` on product rows that carry none,
 * from the captured stay. Rows that already have dates (BookVisit, SynXis)
 * are left untouched. Returns the same array when nothing changed.
 */
export function applyStayToProducts<T extends Record<string, any>>(
    products: T[],
    stay: StayParams | null,
    /**
     * Only a stay captured within this window is written onto products: the
     * dates end up in reminder e-mails to the guest, where a search from
     * days ago would be wrong. The stay still travels as `ei_stay` for
     * reporting regardless.
     */
    maxAgeMs: number = PRODUCT_STAY_MAX_AGE_MS
): T[] {
    if (!stay || !Array.isArray(products) || products.length === 0) {
        return products;
    }
    const capturedAt = Date.parse(stay.captured_at);
    if (!Number.isFinite(capturedAt) || Date.now() - capturedAt > maxAgeMs) {
        return products;
    }
    let changed = false;
    const nights = nightsBetween(stay.checkin, stay.checkout);
    const out = products.map((product) => {
        if (!product || typeof product !== "object") return product;
        if (product.startDate || product.endDate) return product;
        if (String(product.type ?? "").toLowerCase() === "addon") {
            return product;
        }
        changed = true;
        return {
            ...product,
            startDate: stay.checkin,
            endDate: stay.checkout,
            nights,
            ei_stay_source: "url",
        };
    });
    return changed ? out : products;
}
