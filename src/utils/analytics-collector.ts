/**
 * First-touch visitor analytics, kept byte-compatible with the booking
 * frontend's boot file (frontends/booking/src/boot/analytics.ts in the main
 * repo): the same sessionStorage key, the same payload shape. Sharing the key
 * means any same-origin consumer that already reads `assistantAnalyticsPayload`
 * (the embeddable leads-simple form, a booking popup embedded on the page)
 * starts receiving attribution on SDK-only sites for free — and if a booking
 * boot ran first, the SDK reuses its payload instead of overwriting it.
 *
 * Payload: every URL query param verbatim (utm_*, gclid, ttclid, ...) plus
 * `landing_page` (origin + pathname), `date_visited` (ISO timestamp) and
 * `referrer`. First touch wins — it is captured once per browser session and
 * never overwritten.
 *
 * Cross-subdomain handoff: alongside sessionStorage (per-origin, per-tab) the
 * payload is persisted to an `ei_analytics` cookie on the widest parent domain
 * that accepts one (or `cookieDomain` from the SDK options), so a booking page
 * on booking.site.com opened in a new tab can seed its own payload from the
 * cookie. The cookie is session-lifetime, first-touch-wins, and never carries
 * `enhanced_insights` (size, and the visit history is per-origin by design).
 *
 * Consent: capture always happens into plain memory (reading location/referrer
 * touches nothing on the device). Persisting to sessionStorage/cookie — and
 * attaching analytics to uploads — is immediate by default, but when the SDK
 * is configured with `requireConsent: true` it waits for consent signalled via
 * sdk.setConsent(true) or an auto-detected CMP (Cookiebot, OneTrust, TCF).
 */

const ANALYTICS_STORAGE_KEY = "assistantAnalyticsPayload";
const INSIGHTS_STORAGE_KEY = "ei_enhanced_insights";
const ANALYTICS_COOKIE_NAME = "ei_analytics";
const INSIGHTS_COOKIE_NAME = "ei_insights";
// Durable "the visitor said no" marker. Revoking used to only *delete* the
// stored payload, which left nothing behind to distinguish "never consented"
// from "consent withdrawn" — so the booking widget's boot (which shares the
// `assistantAnalyticsPayload` key and has no CMP of its own) re-created the
// payload on the very next page load and the revoke never stuck. Written on
// the same domain as the data it gates so it travels with it across
// subdomains, and session-lifetime like the rest: a CMP that is still present
// re-signals on the next load anyway.
// MUST stay in sync with frontends/booking/src/utilities/analyticsCookie.ts.
const CONSENT_DENIED_COOKIE_NAME = "ei_analytics_consent";

// Cookies cap at ~4KB and ride on every request to *.site.com — refuse to
// write anything close to that.
const MAX_COOKIE_VALUE_LENGTH = 3500;

// The ei_insights cookie carries only compact per-origin summaries: the
// time_per_page map is capped to the pages with the most dwell time, the raw
// visits array is never included, and at most this many origins are kept
// (oldest by last visit dropped first).
const SUMMARY_MAX_PAGES = 10;
const MAX_COOKIE_ORIGINS = 3;

// The insights tracker never prunes localStorage, so cap the raw visit list /
// per-page map to keep session rows bounded; the summary fields still cover
// the full history. Mirrors frontends/booking/src/utilities/enhancedInsights.ts.
const MAX_VISITS = 50;
const MAX_PAGES = 100;

// Campaign touches kept in `attribution_history`. The first is always kept —
// it is the touch that originally acquired the visitor — and the newest ones
// fill the rest, so a long journey drops its middle rather than either end.
const MAX_TOUCHES = 8;

// Parameters that mark a URL as a new campaign touch. Anything else in the
// query string (paging, filters, session ids) is still captured on the touch
// it arrived with, but does not by itself start a new one.
// MUST stay in sync with frontends/booking/src/utilities/attribution.ts.
const CAMPAIGN_PARAMS = [
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "utm_id", "gclid", "gbraid", "wbraid", "dclid", "gad_source",
    "gad_campaign", "fbclid", "ttclid", "msclkid", "twclid", "li_fat_id",
    "epik", "irclickid", "mc_cid", "ad_name",
];

// Keys composePayload derives; stripped when reading a stored payload back
// into the touch it came from.
const DERIVED_KEYS = [
    "attribution_history", "touch_count", "first_utm_source",
    "first_utm_medium", "first_utm_campaign", "first_landing_page",
    "first_referrer", "first_date_visited", "enhanced_insights",
];

interface PageVisit {
    page: string;
    enteredAt: number;
    leftAt?: number;
    /**
     * Milliseconds the page was actually visible, summed across every
     * foreground segment of the visit. Absent on histories recorded before
     * segment tracking existed, where leftAt - enteredAt is the best estimate.
     */
    activeMs?: number;
}

/** Foreground time on a visit, tolerating both shapes of stored history. */
function visitMs(v: PageVisit): number {
    if (typeof v.activeMs === "number" && v.activeMs > 0) return v.activeMs;
    return typeof v.leftAt === "number" && v.leftAt > v.enteredAt
        ? v.leftAt - v.enteredAt
        : 0;
}

export interface AnalyticsCollectorOptions {
    /**
     * Parent domain for the cross-subdomain cookie, e.g. ".site.com". When
     * omitted the widest domain the browser accepts a cookie on is probed
     * (public-suffix rules make deriving it from the hostname guesswork).
     */
    cookieDomain?: string;
    /**
     * When true, a compact per-origin summary of the enhanced-insights page
     * history (no raw visits) is also shared across subdomains via the
     * `ei_insights` cookie, and uploads merge the other origins' summaries
     * into this origin's history. Defaults to TRUE: a visitor who browses
     * site.com and converts on booking.site.com should arrive with the
     * history they actually have. Set explicitly to false to opt out.
     */
    shareInsightsAcrossSubdomains?: boolean;
    /**
     * When true, nothing is persisted to sessionStorage/cookie and no
     * analytics is attached to uploads until consent arrives — via
     * setAnalyticsConsent(true) (exposed as sdk.setConsent) or an
     * auto-detected CMP signal. Defaults to false (persist immediately),
     * matching pre-consent SDK behavior.
     */
    requireConsent?: boolean;
}

let options: AnalyticsCollectorOptions = {};
let memoryPayload: Record<string, unknown> | null = null;
let consentGranted = true;
let cmpListenersAttached = false;
let resolvedCookieDomain: string | null | undefined; // undefined = not probed yet
const consentListeners: Array<(granted: boolean) => void> = [];

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

/**
 * Every value the browser sends for `name` — normally one, but a host-only
 * cookie and a domain-scoped one share a name and are BOTH sent (differing
 * `cookieDomain` settings across a customer's properties, or a probe that
 * fell through to host-only on one page). Reading only when there is exactly
 * one silently dropped the visitor's first touch in that case.
 */
function readCookieValues(name: string): string[] {
    if (typeof document === "undefined") return [];
    const prefix = name + "=";
    const values: string[] = [];
    for (const part of ("; " + document.cookie).split("; ")) {
        if (part.slice(0, prefix.length) !== prefix) continue;
        const raw = part.slice(prefix.length).split(";")[0];
        if (!raw) continue;
        try {
            values.push(decodeURIComponent(raw));
        } catch {
            /* malformed percent-encoding — skip this copy */
        }
    }
    return values;
}

/**
 * Widest domain the browser will accept a cookie on, probed by attempting a
 * throwaway cookie on progressively longer suffixes of the hostname (the
 * browser silently rejects public suffixes like `.co.uk`). Returns null for
 * localhost/IPs — the cookie is then host-only, which is still correct.
 */
function resolveCookieDomain(): string | null {
    if (resolvedCookieDomain !== undefined) return resolvedCookieDomain;
    resolvedCookieDomain = null;
    try {
        if (options.cookieDomain) {
            resolvedCookieDomain = options.cookieDomain.replace(/^\./, "");
            return resolvedCookieDomain;
        }
        const hostname = window.location.hostname;
        if (!hostname || /^[\d.]+$/.test(hostname) || hostname === "localhost") {
            return null;
        }
        const parts = hostname.split(".");
        const probe = "ei_domain_probe";
        for (let i = parts.length - 2; i >= 0; i--) {
            const candidate = parts.slice(i).join(".");
            document.cookie = `${probe}=1; domain=.${candidate}; path=/; SameSite=Lax`;
            if (document.cookie.indexOf(`${probe}=1`) !== -1) {
                document.cookie = `${probe}=; domain=.${candidate}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                resolvedCookieDomain = candidate;
                return resolvedCookieDomain;
            }
        }
    } catch {
        /* fall through to host-only */
    }
    return resolvedCookieDomain;
}

/** Session cookie on the resolved parent domain; false when the encoded value
 * would blow the size budget (caller may shrink and retry). */
function writeCookieValue(name: string, payload: unknown): boolean {
    try {
        const value = encodeURIComponent(JSON.stringify(payload));
        if (value.length > MAX_COOKIE_VALUE_LENGTH) return false;
        const domain = resolveCookieDomain();
        const secure =
            window.location.protocol === "https:" ? "; Secure" : "";
        // Session cookie on purpose: same lifetime story as sessionStorage,
        // and the least alarming classification in a consent scanner.
        document.cookie =
            `${name}=${value}` +
            (domain ? `; domain=.${domain}` : "") +
            `; path=/; SameSite=Lax${secure}`;
        return true;
    } catch {
        return false; /* attribution is best-effort */
    }
}

function clearCookieValue(name: string): void {
    try {
        const domain = resolveCookieDomain();
        document.cookie =
            `${name}=` +
            (domain ? `; domain=.${domain}` : "") +
            "; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch {
        /* ignore */
    }
}

/** Every copy of `name` that parses as a JSON object. */
function readCookieObjects(name: string): Record<string, unknown>[] {
    const objects: Record<string, unknown>[] = [];
    for (const raw of readCookieValues(name)) {
        try {
            const parsed = JSON.parse(raw);
            if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                objects.push(parsed as Record<string, unknown>);
            }
        } catch {
            /* truncated or not ours — skip this copy */
        }
    }
    return objects;
}

/**
 * Per-hostname insights summaries across every copy of the cookie. Each origin
 * owns its own key, so copies are merged key-wise; if the same host appears
 * twice the more recently active copy wins.
 */
function readInsightsCookieMap(): Record<string, unknown> {
    const merged: Record<string, unknown> = {};
    for (const map of readCookieObjects(INSIGHTS_COOKIE_NAME)) {
        for (const [host, summary] of Object.entries(map)) {
            if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
                continue;
            }
            const existing = merged[host] as
                | { last_visit_at?: unknown }
                | undefined;
            if (
                existing &&
                String((summary as any).last_visit_at ?? "") <=
                    String(existing.last_visit_at ?? "")
            ) {
                continue;
            }
            merged[host] = summary;
        }
    }
    return merged;
}

/**
 * Persist the payload to the cross-subdomain cookie, overwriting what is
 * there — the merged payload always contains the cookie's own history, so it
 * is never a downgrade. Drops the oldest middle touches when the value would
 * exceed the cookie budget; the acquiring touch and the current one are the
 * last things to go, and sessionStorage still holds the full history.
 */
function writeAnalyticsCookie(payload: Record<string, unknown>): void {
    if (writeCookieValue(ANALYTICS_COOKIE_NAME, payload)) return;
    const history = historyOf(payload);
    for (let keep = history.length - 1; keep >= 2; keep--) {
        const trimmed = [history[0]!, ...history.slice(-(keep - 1))];
        if (
            writeCookieValue(ANALYTICS_COOKIE_NAME, composePayload(trimmed))
        ) {
            return;
        }
    }
    if (history.length > 1) {
        writeCookieValue(
            ANALYTICS_COOKIE_NAME,
            composePayload([history[0]!, history[history.length - 1]!])
        );
    }
}

function clearAnalyticsCookie(): void {
    clearCookieValue(ANALYTICS_COOKIE_NAME);
}

function readAnalyticsCookiePayload(): Record<string, unknown> | null {
    const candidates = readCookieObjects(ANALYTICS_COOKIE_NAME);
    if (candidates.length === 0) return null;
    // Duplicate copies (a host-only cookie alongside a domain-scoped one) are
    // both sent. Prefer the most complete history; on a tie, the one whose
    // acquiring touch is oldest. ISO-8601 sorts lexicographically, and a copy
    // carrying no timestamp never displaces one that does.
    const rank = (c: Record<string, unknown>) => {
        const history = historyOf(c);
        const first = history[0];
        const at = first && typeof first.date_visited === "string"
            ? first.date_visited
            : "";
        return { touches: history.length, at };
    };
    let best = candidates[0]!;
    let bestRank = rank(best);
    for (const candidate of candidates.slice(1)) {
        const r = rank(candidate);
        const better =
            r.touches > bestRank.touches ||
            (r.touches === bestRank.touches &&
                !!r.at &&
                (!bestRank.at || r.at < bestRank.at));
        if (better) {
            best = candidate;
            bestRank = r;
        }
    }
    return best;
}

// ---------------------------------------------------------------------------
// Cross-subdomain insights summary (on unless shareInsightsAcrossSubdomains
// is explicitly false)
// ---------------------------------------------------------------------------
// The ei_insights cookie holds `{ [hostname]: summary }` — each origin only
// ever updates its own key, and merge-on-read excludes the reader's own key,
// so an origin's visits are never double-counted against its local history.

/** This origin's history as a compact summary: scalars + a dwell-capped
 * time_per_page, never the raw visits array. */
function buildLocalInsightsSummary(): Record<string, unknown> | null {
    const full = readEnhancedInsights();
    if (!full) return null;
    const { visits: _visits, time_per_page, ...scalars } = full as {
        visits?: unknown;
        time_per_page?: Record<string, number>;
        [key: string]: unknown;
    };
    const capped: Record<string, number> = {};
    Object.entries(time_per_page ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, SUMMARY_MAX_PAGES)
        .forEach(([k, v]) => {
            capped[k] = v;
        });
    return { ...scalars, time_per_page: capped };
}

/**
 * Refresh this origin's entry in the ei_insights cookie. Called by the
 * EnhancedInsightsTool after every history save; a no-op unless
 * `shareInsightsAcrossSubdomains` is enabled and consent allows persistence.
 * When the cookie budget is exceeded, oldest foreign origins are dropped
 * first, then this origin's time_per_page map.
 */
export function updateInsightsSummaryCookie(): void {
    try {
        if (
            typeof window === "undefined" ||
            options.shareInsightsAcrossSubdomains === false ||
            !isAnalyticsConsentGranted()
        ) {
            return;
        }
        const summary = buildLocalInsightsSummary();
        if (!summary) return;
        const hostname = window.location.hostname;
        const existing = readInsightsCookieMap();
        let foreign = Object.entries(existing)
            .filter(([h, s]) => h !== hostname && s && typeof s === "object")
            // Oldest last visit first, so shrinking drops stale origins.
            .sort((a, b) =>
                String((a[1] as any)?.last_visit_at ?? "").localeCompare(
                    String((b[1] as any)?.last_visit_at ?? "")
                )
            );
        foreign = foreign.slice(
            Math.max(0, foreign.length - (MAX_COOKIE_ORIGINS - 1))
        );
        let own: Record<string, unknown> = summary;
        for (;;) {
            const candidate: Record<string, unknown> = {};
            for (const [h, s] of foreign) candidate[h] = s;
            candidate[hostname] = own;
            if (writeCookieValue(INSIGHTS_COOKIE_NAME, candidate)) return;
            if (foreign.length > 0) {
                foreign = foreign.slice(1);
                continue;
            }
            if (own.time_per_page) {
                const { time_per_page: _tpp, ...rest } = own;
                own = rest;
                continue;
            }
            // `pages` is the only remaining unbounded field, and letting it
            // win meant the write failed and the cookie kept a STALE summary
            // forever — history that looked present but had silently stopped
            // counting. Drop the oldest half instead; the scalars still cover
            // the full history.
            const pages = typeof own.pages === "string" ? own.pages : "";
            if (pages) {
                const parts = pages.split(",");
                own = {
                    ...own,
                    pages: parts.slice(Math.ceil(parts.length / 2)).join(","),
                };
                continue;
            }
            return; // even the bare scalars don't fit — give up
        }
    } catch {
        /* attribution is best-effort */
    }
}

/** Summaries the *other* origins stored in the ei_insights cookie. */
function readForeignInsightsSummaries(): Record<string, unknown>[] {
    if (typeof window === "undefined") return [];
    const map = readInsightsCookieMap();
    const hostname = window.location.hostname;
    return Object.entries(map)
        .filter(
            ([h, s]) => h !== hostname && s && typeof s === "object" && !Array.isArray(s)
        )
        .map(([, s]) => s as Record<string, unknown>);
}

/**
 * Additive merge of this origin's history with the other origins' summaries:
 * counts and dwell times sum, pages union, first/last visit span widens. The
 * raw visits array stays local-only — the cookie never carried the other
 * origins' individual visits.
 */
function mergeInsights(
    local: Record<string, unknown> | null,
    foreign: Record<string, unknown>[]
): Record<string, unknown> | null {
    if (foreign.length === 0) return local;
    const all = local ? [local, ...foreign] : foreign;
    const num = (v: unknown) =>
        typeof v === "number" && isFinite(v) ? v : 0;
    let visitCount = 0;
    let totalTime = 0;
    const pages: string[] = [];
    const timePerPage: Record<string, number> = {};
    let first: string | null = null;
    let last: string | null = null;
    for (const s of all) {
        visitCount += num(s.visit_count);
        totalTime += num(s.total_time_seconds);
        String(s.pages ?? "")
            .split(",")
            .forEach((p) => {
                if (p && pages.indexOf(p) === -1) pages.push(p);
            });
        const tpp = s.time_per_page;
        if (tpp && typeof tpp === "object" && !Array.isArray(tpp)) {
            for (const [k, v] of Object.entries(
                tpp as Record<string, unknown>
            )) {
                timePerPage[k] = (timePerPage[k] ?? 0) + num(v);
            }
        }
        const f = typeof s.first_visit_at === "string" ? s.first_visit_at : null;
        const l = typeof s.last_visit_at === "string" ? s.last_visit_at : null;
        if (f && (!first || f < first)) first = f;
        if (l && (!last || l > last)) last = l;
    }
    const merged: Record<string, unknown> = {
        time_per_page: timePerPage,
        visit_count: visitCount,
        unique_pages: pages.length,
        total_time_seconds: totalTime,
        pages: pages.join(","),
    };
    if (first) merged.first_visit_at = first;
    if (last) merged.last_visit_at = last;
    if (local && Array.isArray(local.visits)) merged.visits = local.visits;
    return merged;
}

// ---------------------------------------------------------------------------
// Consent (CMP auto-detection)
// ---------------------------------------------------------------------------

/**
 * Current CMP verdict: true/false when a known CMP has answered, null when no
 * CMP (or no answer yet) is detectable synchronously.
 */
function cmpConsentState(): boolean | null {
    try {
        const w = window as any;
        const cookiebot = w.Cookiebot;
        if (
            cookiebot &&
            cookiebot.consent &&
            typeof cookiebot.consent.statistics === "boolean" &&
            cookiebot.hasResponse
        ) {
            return !!(
                cookiebot.consent.statistics || cookiebot.consent.marketing
            );
        }
        if (typeof w.OnetrustActiveGroups === "string" && w.OnetrustActiveGroups) {
            // C0002 = performance/analytics, C0004 = targeting.
            return /C0002|C0004/.test(w.OnetrustActiveGroups);
        }
    } catch {
        /* treat as unknown */
    }
    return null;
}

function attachCmpListeners(): void {
    if (cmpListenersAttached || typeof window === "undefined") return;
    cmpListenersAttached = true;

    const evaluate = () => {
        const state = cmpConsentState();
        if (state === true) setAnalyticsConsent(true);
        else if (state === false) setAnalyticsConsent(false);
    };

    try {
        window.addEventListener("CookiebotOnConsentReady", evaluate);
        window.addEventListener("CookiebotOnAccept", evaluate);
        window.addEventListener("CookiebotOnDecline", evaluate);
        window.addEventListener("OneTrustGroupsUpdated", evaluate);

        // IAB TCF v2: purpose 1 = store and/or access information on a device.
        const tcfapi = (window as any).__tcfapi;
        if (typeof tcfapi === "function") {
            tcfapi("addEventListener", 2, (tcData: any, success: boolean) => {
                if (!success || !tcData) return;
                if (
                    tcData.eventStatus === "tcloaded" ||
                    tcData.eventStatus === "useractioncomplete"
                ) {
                    setAnalyticsConsent(!!tcData.purpose?.consents?.[1]);
                }
            });
        }
    } catch {
        /* the explicit setConsent API remains available */
    }
}

/**
 * Effective consent for anything that stores analytics on the device or
 * attaches it to uploads. True unless `requireConsent` is set and consent has
 * not (yet) been granted.
 */
export function isAnalyticsConsentGranted(): boolean {
    if (isAnalyticsConsentDenied()) return false;
    return !options.requireConsent || consentGranted;
}

/**
 * Whether analytics consent was explicitly refused on this device — by this
 * page or by an earlier one on another subdomain. Distinct from "not granted
 * yet": absence of the marker means no answer, which leaves the persist-by-
 * default behaviour untouched for customers who never wire up consent at all.
 */
export function isAnalyticsConsentDenied(): boolean {
    return readCookieValues(CONSENT_DENIED_COOKIE_NAME).indexOf("0") !== -1;
}

/**
 * Subscribe to consent changes — used by the SDK to start/stop
 * consent-dependent tools (e.g. enhanced-insights page-visit recording) when
 * consent arrives after initialize() or is revoked later.
 */
export function onAnalyticsConsentChange(
    listener: (granted: boolean) => void
): void {
    consentListeners.push(listener);
}

/**
 * Grant or revoke consent for analytics persistence. Exposed as
 * sdk.setConsent() so customers can wire it to any CMP's callback; also called
 * by the built-in CMP listeners. Revoking clears what was persisted.
 */
export function setAnalyticsConsent(granted: boolean): void {
    const changed = granted !== consentGranted;
    consentGranted = granted;
    if (granted) {
        clearCookieValue(CONSENT_DENIED_COOKIE_NAME);
        persistAnalyticsPayload();
    } else {
        // Marker first: every other consumer of these cookies keys off it, and
        // a write that fails silently must not look like "no answer yet".
        writeCookieValue(CONSENT_DENIED_COOKIE_NAME, 0);
        clearAnalyticsCookie();
        // Device-wide revoke: the shared insights cookie goes too, including
        // other origins' summaries — consent is per device, not per origin.
        clearCookieValue(INSIGHTS_COOKIE_NAME);
        try {
            sessionStorage.removeItem(ANALYTICS_STORAGE_KEY);
        } catch {
            /* ignore */
        }
    }
    if (changed) {
        for (const listener of consentListeners) {
            try {
                listener(granted);
            } catch {
                /* one listener failing must not break the rest */
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Capture & persistence
// ---------------------------------------------------------------------------

type Touch = Record<string, unknown>;

function captureCurrentPage(): Touch {
    const params: Record<string, string> = {};
    for (const [key, value] of new URL(
        window.location.href
    ).searchParams.entries()) {
        params[key] = value;
    }
    return {
        ...params,
        landing_page: window.location.origin + window.location.pathname,
        date_visited: new Date().toISOString(),
        referrer: document.referrer,
    };
}

/** Stable key of a touch's campaign parameters, for equality comparison. */
function touchSignature(touch: Touch): string {
    return CAMPAIGN_PARAMS.filter((k) => touch[k] !== undefined)
        .map((k) => k + "=" + String(touch[k]))
        .join("&");
}

/**
 * The touch history a stored payload carries. Payloads written before
 * attribution history existed are a single touch in their own right, so they
 * become history[0] rather than being discarded.
 */
function historyOf(payload: Touch | null | undefined): Touch[] {
    if (!payload) return [];
    const stored = payload.attribution_history;
    if (Array.isArray(stored)) {
        return stored.filter(
            (t): t is Touch =>
                !!t && typeof t === "object" && !Array.isArray(t)
        );
    }
    const legacy: Touch = {};
    for (const [k, v] of Object.entries(payload)) {
        if (DERIVED_KEYS.indexOf(k) === -1) legacy[k] = v;
    }
    return Object.keys(legacy).length > 0 ? [legacy] : [];
}

/**
 * Union of touch lists seen in different places (this tab's sessionStorage and
 * the cross-subdomain cookie), oldest first. Deduplicated on timestamp +
 * campaign signature so the same touch recorded on two subdomains counts once.
 */
function mergeHistories(...lists: Touch[][]): Touch[] {
    const seen = new Set<string>();
    const all: Touch[] = [];
    for (const list of lists) {
        for (const touch of list) {
            const key = String(touch.date_visited ?? "") + "|" + touchSignature(touch);
            if (seen.has(key)) continue;
            seen.add(key);
            all.push(touch);
        }
    }
    return all.sort((a, b) =>
        String(a.date_visited ?? "").localeCompare(String(b.date_visited ?? ""))
    );
}

/** Keep the acquiring touch and the most recent ones; drop the middle. */
function capHistory(history: Touch[]): Touch[] {
    if (history.length <= MAX_TOUCHES) return history;
    return [history[0]!, ...history.slice(-(MAX_TOUCHES - 1))];
}

/**
 * Fold this page view into the history. The very first page view is always a
 * touch (direct and organic arrivals matter too); after that only a URL
 * carrying campaign parameters that differ from the latest touch starts a new
 * one, so ordinary navigation never displaces the campaign that is running.
 */
function applyTouch(history: Touch[], current: Touch): Touch[] {
    if (history.length === 0) return [current];
    const signature = touchSignature(current);
    if (!signature) return history;
    if (signature === touchSignature(history[history.length - 1]!)) {
        return history;
    }
    return capHistory([...history, current]);
}

/**
 * The stored payload: the LATEST touch at the top level (so `utm_source` is
 * the campaign that most recently brought the visitor back), the acquiring
 * touch mirrored into `first_*` scalars, and the whole ordered history under
 * `attribution_history`. The scalars exist because funnel conditions address
 * JSON-path scalars and cannot read into an array.
 */
function composePayload(history: Touch[]): Touch {
    if (history.length === 0) return {};
    const first = history[0]!;
    const latest = history[history.length - 1]!;
    const payload: Touch = { ...latest };
    const carry = (to: string, from: string) => {
        if (first[from] !== undefined) payload[to] = first[from];
    };
    carry("first_utm_source", "utm_source");
    carry("first_utm_medium", "utm_medium");
    carry("first_utm_campaign", "utm_campaign");
    carry("first_landing_page", "landing_page");
    carry("first_referrer", "referrer");
    carry("first_date_visited", "date_visited");
    payload.touch_count = history.length;
    payload.attribution_history = history;
    return payload;
}

function persistAnalyticsPayload(): void {
    if (typeof window === "undefined" || !memoryPayload) return;
    // An explicit refusal outranks the persist-by-default behaviour, and may
    // have been recorded by an earlier page on another subdomain.
    if (isAnalyticsConsentDenied()) return;
    try {
        // Both are overwritten rather than written once: memoryPayload was
        // built by folding whatever they already held into the current page,
        // so it is always a superset of what it replaces.
        if (window.sessionStorage) {
            sessionStorage.setItem(
                ANALYTICS_STORAGE_KEY,
                JSON.stringify(memoryPayload)
            );
        }
        writeAnalyticsCookie(memoryPayload);
    } catch {
        /* privacy mode / quota — attribution is best-effort */
    }
}

/**
 * Capture the first-touch payload (memory always; sessionStorage + cookie once
 * consent allows). Safe to call multiple times.
 */
export function ensureAnalyticsPayload(
    opts?: AnalyticsCollectorOptions
): void {
    if (typeof window === "undefined") return;
    options = opts ?? {};
    resolvedCookieDomain = undefined; // re-resolve if cookieDomain changed
    try {
        // Seed memory in first-touch order: an existing sessionStorage payload
        // (booking boot or an earlier SDK page in this tab), then the
        // cross-subdomain cookie (merged over this page's own params so
        // anything new in the URL is kept but the original touch wins), then
        // a fresh capture.
        // Fold this page view into every history already on the device: this
        // tab's own, and the cross-subdomain cookie's (which may carry touches
        // from another subdomain this tab has never seen).
        const raw = window.sessionStorage
            ? sessionStorage.getItem(ANALYTICS_STORAGE_KEY)
            : null;
        let stored: Touch | null = null;
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                stored = parsed as Touch;
            }
        }
        const history = applyTouch(
            mergeHistories(
                historyOf(stored),
                historyOf(readAnalyticsCookiePayload())
            ),
            captureCurrentPage()
        );
        memoryPayload = composePayload(history);

        if (options.requireConsent) {
            attachCmpListeners();
            const state = cmpConsentState();
            if (state === null) {
                // No CMP, or one that has not answered yet. Waiting is not a
                // refusal, so no denial marker is recorded — other consumers
                // must not read "no answer yet" as "the visitor said no".
                consentGranted = false;
            } else {
                // A CMP that has already answered by the time we boot. Route
                // it through the same path as a runtime change rather than
                // just setting the flag, so a refusal is written to the
                // shared marker where the booking widget's boot can see it —
                // that CMP fires no event for an answer it gave earlier.
                setAnalyticsConsent(state);
            }
        } else {
            consentGranted = true;
            persistAnalyticsPayload();
        }
    } catch {
        /* privacy mode / quota — attribution is best-effort */
    }
}

// ---------------------------------------------------------------------------
// Enhanced insights & upload payload
// ---------------------------------------------------------------------------

/**
 * Page paths become JSON keys in `time_per_page` and appear as segments of
 * funnel condition fields, which the backend SQL splits on dots — so dots must
 * be normalized out. MUST stay in sync with normalizePagePath in the main
 * repo's frontends/booking/src/utilities/enhancedInsights.ts and
 * frontends/assistant/src/components/funnels/conditionUtils.ts.
 * Rules: pathname only (no query/hash), leading slash, no trailing slash
 * (except root), dots replaced with underscores.
 */
function pagePathOnly(path: string): string {
    let p = path.trim();
    if (!p) return "";
    const cutAt = p.search(/[?#]/);
    if (cutAt >= 0) p = p.slice(0, cutAt);
    if (!p.startsWith("/")) p = "/" + p;
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p;
}

function normalizePagePath(path: string): string {
    // Dots only have to go in `time_per_page`, where the path becomes a JSON
    // key that the backend splits on dots. `pages` is a value matched with
    // ilike, so it keeps them — mangling `/om-oss.html` there would break
    // existing funnel conditions.
    return pagePathOnly(path).replace(/\./g, "_");
}

/**
 * Shape the EnhancedInsightsTool's raw page-visit history into the summary
 * object stored under `enhanced_insights` in lead/session analytics — scalar
 * summaries alongside the (capped) raw visits, because funnel conditions
 * operate on JSON-path scalars. Same output as the booking frontend's
 * readEnhancedInsights.
 */
export function readEnhancedInsights(): Record<string, unknown> | null {
    try {
        if (typeof window === "undefined" || !window.localStorage) return null;
        const raw = window.localStorage.getItem(INSIGHTS_STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as { visits?: PageVisit[] };
        const visits = Array.isArray(parsed?.visits)
            ? parsed.visits.filter(
                  (v) =>
                      v &&
                      typeof v.page === "string" &&
                      typeof v.enteredAt === "number"
              )
            : [];
        const firstVisit = visits[0];
        const lastVisit = visits[visits.length - 1];
        if (!firstVisit || !lastVisit) return null;

        // Query strings are stripped here as well as at write time, so
        // histories recorded before that change stop counting one page as
        // several.
        const uniquePages: string[] = [];
        for (const v of visits) {
            const page = pagePathOnly(v.page);
            if (page && uniquePages.indexOf(page) === -1) uniquePages.push(page);
        }
        const totalTimeMs = visits.reduce((sum, v) => sum + visitMs(v), 0);

        // Total dwell time per normalized page path, in whole seconds — the
        // basis for "visited page X (for more than Y seconds)" funnel entry
        // conditions.
        const msPerPage: Record<string, number> = {};
        for (const v of visits) {
            const key = normalizePagePath(v.page);
            if (!key) continue;
            msPerPage[key] = (msPerPage[key] ?? 0) + visitMs(v);
        }
        const timePerPage: Record<string, number> = {};
        Object.entries(msPerPage)
            .slice(0, MAX_PAGES)
            .forEach(([k, ms]) => {
                timePerPage[k] = Math.round(ms / 1000);
            });

        return {
            time_per_page: timePerPage,
            visits: visits.slice(-MAX_VISITS),
            visit_count: visits.length,
            unique_pages: uniquePages.length,
            total_time_seconds: Math.round(totalTimeMs / 1000),
            pages: uniquePages.join(","),
            first_visit_at: new Date(firstVisit.enteredAt).toISOString(),
            last_visit_at: new Date(lastVisit.enteredAt).toISOString(),
        };
    } catch {
        return null;
    }
}

/**
 * Merged analytics payload for upload, as a JSON string (the same wire format
 * the booking frontend uses for `ainternal_lead_analytics`): the first-touch
 * payload plus the current `enhanced_insights` snapshot. Returns null when
 * there is nothing to report, or when `requireConsent` is set and consent has
 * not been granted.
 */
export function collectAnalytics(): string | null {
    try {
        if (!isAnalyticsConsentGranted()) return null;
        let payload: Record<string, unknown> = {};
        if (typeof window !== "undefined" && window.sessionStorage) {
            const base = sessionStorage.getItem(ANALYTICS_STORAGE_KEY);
            if (base) {
                const parsed = JSON.parse(base);
                if (parsed && typeof parsed === "object") {
                    payload = parsed;
                }
            }
        }
        if (Object.keys(payload).length === 0 && memoryPayload) {
            payload = { ...memoryPayload };
        }
        let enhancedInsights = readEnhancedInsights();
        if (options.shareInsightsAcrossSubdomains !== false) {
            enhancedInsights = mergeInsights(
                enhancedInsights,
                readForeignInsightsSummaries()
            );
        }
        if (enhancedInsights) {
            payload.enhanced_insights = enhancedInsights;
        }
        return Object.keys(payload).length > 0 ? JSON.stringify(payload) : null;
    } catch {
        return null;
    }
}
