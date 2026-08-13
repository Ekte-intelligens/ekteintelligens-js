import { SDKOptions } from '../types';

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
export declare class LinkTrackingTool {
    private supabaseService;
    private isInitialized;
    /** URL query parameter carrying the encoded funnel-subscriber id. */
    private static readonly URL_PARAM;
    /** sessionStorage key holding the short ids already tracked this session. */
    private static readonly STORAGE_KEY;
    constructor(options: SDKOptions);
    initialize(): Promise<boolean>;
    /**
     * Read the `?s=` parameter and, if it is present and not already tracked
     * in this browser session, record an `opened_link` event for it.
     */
    private trackShortlinkOpen;
    /** Get the encoded funnel-subscriber id from the current URL, if any. */
    private getSubscriberShortId;
    /** Read the list of short ids already tracked this session. */
    private getTrackedShortIds;
    /** Append a short id to the set of ids tracked this session. */
    private markShortIdTracked;
    destroy(): void;
}
//# sourceMappingURL=link-tracking.d.ts.map