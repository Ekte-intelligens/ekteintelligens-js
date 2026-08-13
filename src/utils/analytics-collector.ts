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
 * `referrer`. First touch wins — it is written once per browser session and
 * never overwritten.
 */

const ANALYTICS_STORAGE_KEY = "assistantAnalyticsPayload";
const INSIGHTS_STORAGE_KEY = "ei_enhanced_insights";

// The insights tracker never prunes localStorage, so cap the raw visit list /
// per-page map to keep session rows bounded; the summary fields still cover
// the full history. Mirrors frontends/booking/src/utilities/enhancedInsights.ts.
const MAX_VISITS = 50;
const MAX_PAGES = 100;

interface PageVisit {
    page: string;
    enteredAt: number;
    leftAt?: number;
}

/**
 * Capture the first-touch payload into sessionStorage if this browser session
 * doesn't have one yet. Safe to call multiple times.
 */
export function ensureAnalyticsPayload(): void {
    if (typeof window === "undefined" || !window.sessionStorage) {
        return;
    }
    try {
        if (sessionStorage.getItem(ANALYTICS_STORAGE_KEY)) {
            return;
        }

        const params: Record<string, string> = {};
        for (const [key, value] of new URL(
            window.location.href
        ).searchParams.entries()) {
            params[key] = value;
        }

        const analyticsPayload = {
            ...params,
            landing_page: window.location.origin + window.location.pathname,
            date_visited: new Date().toISOString(),
            referrer: document.referrer,
        };

        sessionStorage.setItem(
            ANALYTICS_STORAGE_KEY,
            JSON.stringify(analyticsPayload)
        );
    } catch {
        /* privacy mode / quota — attribution is best-effort */
    }
}

/**
 * Page paths become JSON keys in `time_per_page` and appear as segments of
 * funnel condition fields, which the backend SQL splits on dots — so dots must
 * be normalized out. MUST stay in sync with normalizePagePath in the main
 * repo's frontends/booking/src/utilities/enhancedInsights.ts and
 * frontends/assistant/src/components/funnels/conditionUtils.ts.
 * Rules: pathname only (no query/hash), leading slash, no trailing slash
 * (except root), dots replaced with underscores.
 */
function normalizePagePath(path: string): string {
    let p = path.trim();
    if (!p) return "";
    const cutAt = p.search(/[?#]/);
    if (cutAt >= 0) p = p.slice(0, cutAt);
    if (!p.startsWith("/")) p = "/" + p;
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p.replace(/\./g, "_");
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

        const uniquePages: string[] = [];
        for (const v of visits) {
            if (uniquePages.indexOf(v.page) === -1) uniquePages.push(v.page);
        }
        const totalTimeMs = visits.reduce(
            (sum, v) =>
                sum +
                (typeof v.leftAt === "number" && v.leftAt > v.enteredAt
                    ? v.leftAt - v.enteredAt
                    : 0),
            0
        );

        // Total dwell time per normalized page path, in whole seconds — the
        // basis for "visited page X (for more than Y seconds)" funnel entry
        // conditions.
        const msPerPage: Record<string, number> = {};
        for (const v of visits) {
            const key = normalizePagePath(v.page);
            if (!key) continue;
            const ms =
                typeof v.leftAt === "number" && v.leftAt > v.enteredAt
                    ? v.leftAt - v.enteredAt
                    : 0;
            msPerPage[key] = (msPerPage[key] ?? 0) + ms;
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
 * sessionStorage payload plus the current `enhanced_insights` snapshot.
 * Returns null when there is nothing to report.
 */
export function collectAnalytics(): string | null {
    try {
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
        const enhancedInsights = readEnhancedInsights();
        if (enhancedInsights) {
            payload.enhanced_insights = enhancedInsights;
        }
        return Object.keys(payload).length > 0 ? JSON.stringify(payload) : null;
    } catch {
        return null;
    }
}
