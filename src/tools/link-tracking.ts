import { SupabaseService } from "../services/supabase-service";
import { SDKOptions } from "../types";

/**
 * Tracks when a recipient opens a shortlink we sent them.
 *
 * Outbound funnel messages (e.g. abandoned-cart emails) link back with an
 * `?s=<id_short_encoded>` parameter that identifies the funnel subscriber.
 * When such a link is opened, we record an `opened_link` event through the
 * `create-event` edge function.
 *
 * This tool always runs on `sdk.initialize()`; it is a no-op unless an `?s=`
 * parameter is present in the URL, so there is no feature flag to enable it.
 */
export class LinkTrackingTool {
    private supabaseService: SupabaseService;
    private isInitialized = false;

    /** URL query parameter carrying the encoded funnel-subscriber id. */
    private static readonly URL_PARAM = "s";
    /** sessionStorage key holding the short ids already tracked this session. */
    private static readonly STORAGE_KEY = "ei_tracked_subscriber_ids";

    constructor(options: SDKOptions) {
        this.supabaseService = new SupabaseService(
            options.supabaseUrl,
            options.supabaseAnonKey
        );
    }

    async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            return true;
        }
        this.isInitialized = true;

        // Fire-and-forget: a network round-trip must not delay SDK init or
        // the other tools that initialize after this one.
        void this.trackShortlinkOpen();
        return true;
    }

    /**
     * Read the `?s=` parameter and, if it is present and not already tracked
     * in this browser session, record an `opened_link` event for it.
     */
    private async trackShortlinkOpen(): Promise<void> {
        if (typeof window === "undefined") {
            return;
        }

        const subscriberShortId = this.getSubscriberShortId();
        if (!subscriberShortId) {
            return;
        }

        // Dedupe: a page reload or SPA re-render must not re-fire the event.
        if (this.getTrackedShortIds().includes(subscriberShortId)) {
            return;
        }

        try {
            const ok = await this.supabaseService.createAssistantEvent({
                id_short_encoded: subscriberShortId,
                type: "funnel_subscriber",
            });
            // Only mark as tracked on success, so a failed call is retried on
            // the next page load instead of being silently dropped.
            if (ok) {
                this.markShortIdTracked(subscriberShortId);
            }
        } catch (error) {
            console.error("Failed to track shortlink open:", error);
        }
    }

    /** Get the encoded funnel-subscriber id from the current URL, if any. */
    private getSubscriberShortId(): string | null {
        try {
            const value = new URLSearchParams(window.location.search).get(
                LinkTrackingTool.URL_PARAM
            );
            return value && value.trim() ? value.trim() : null;
        } catch {
            return null;
        }
    }

    /** Read the list of short ids already tracked this session. */
    private getTrackedShortIds(): string[] {
        if (typeof window === "undefined" || !window.sessionStorage) {
            return [];
        }
        try {
            const stored = sessionStorage.getItem(
                LinkTrackingTool.STORAGE_KEY
            );
            if (!stored) {
                return [];
            }
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    /** Append a short id to the set of ids tracked this session. */
    private markShortIdTracked(shortId: string): void {
        if (typeof window === "undefined" || !window.sessionStorage) {
            return;
        }
        try {
            const current = this.getTrackedShortIds();
            if (current.includes(shortId)) {
                return;
            }
            sessionStorage.setItem(
                LinkTrackingTool.STORAGE_KEY,
                JSON.stringify([...current, shortId])
            );
        } catch (error) {
            console.warn("Failed to persist tracked shortlink id:", error);
        }
    }

    public destroy(): void {
        this.isInitialized = false;
    }
}
