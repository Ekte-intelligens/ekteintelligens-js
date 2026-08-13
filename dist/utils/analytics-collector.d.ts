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
     * into this origin's history. Defaults to false: insights stay
     * per-origin, exactly as before.
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
/**
 * Refresh this origin's entry in the ei_insights cookie. Called by the
 * EnhancedInsightsTool after every history save; a no-op unless
 * `shareInsightsAcrossSubdomains` is enabled and consent allows persistence.
 * When the cookie budget is exceeded, oldest foreign origins are dropped
 * first, then this origin's time_per_page map.
 */
export declare function updateInsightsSummaryCookie(): void;
/**
 * Effective consent for anything that stores analytics on the device or
 * attaches it to uploads. True unless `requireConsent` is set and consent has
 * not (yet) been granted.
 */
export declare function isAnalyticsConsentGranted(): boolean;
/**
 * Subscribe to consent changes — used by the SDK to start/stop
 * consent-dependent tools (e.g. enhanced-insights page-visit recording) when
 * consent arrives after initialize() or is revoked later.
 */
export declare function onAnalyticsConsentChange(listener: (granted: boolean) => void): void;
/**
 * Grant or revoke consent for analytics persistence. Exposed as
 * sdk.setConsent() so customers can wire it to any CMP's callback; also called
 * by the built-in CMP listeners. Revoking clears what was persisted.
 */
export declare function setAnalyticsConsent(granted: boolean): void;
/**
 * Capture the first-touch payload (memory always; sessionStorage + cookie once
 * consent allows). Safe to call multiple times.
 */
export declare function ensureAnalyticsPayload(opts?: AnalyticsCollectorOptions): void;
/**
 * Shape the EnhancedInsightsTool's raw page-visit history into the summary
 * object stored under `enhanced_insights` in lead/session analytics — scalar
 * summaries alongside the (capped) raw visits, because funnel conditions
 * operate on JSON-path scalars. Same output as the booking frontend's
 * readEnhancedInsights.
 */
export declare function readEnhancedInsights(): Record<string, unknown> | null;
/**
 * Merged analytics payload for upload, as a JSON string (the same wire format
 * the booking frontend uses for `ainternal_lead_analytics`): the first-touch
 * payload plus the current `enhanced_insights` snapshot. Returns null when
 * there is nothing to report, or when `requireConsent` is set and consent has
 * not been granted.
 */
export declare function collectAnalytics(): string | null;
//# sourceMappingURL=analytics-collector.d.ts.map