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
/**
 * Capture the first-touch payload into sessionStorage if this browser session
 * doesn't have one yet. Safe to call multiple times.
 */
export declare function ensureAnalyticsPayload(): void;
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
 * sessionStorage payload plus the current `enhanced_insights` snapshot.
 * Returns null when there is nothing to report.
 */
export declare function collectAnalytics(): string | null;
//# sourceMappingURL=analytics-collector.d.ts.map