import { SDKOptions } from '../types';

export declare class AbandonedCartTool {
    private options;
    private supabaseService;
    private inputDetector?;
    private productDetector?;
    private totalExtractor?;
    private _sessionId?;
    private isInitialized;
    private previousContent;
    private previousProducts;
    private previousTotal;
    constructor(options: SDKOptions);
    initialize(): Promise<boolean>;
    private handleContentUpdate;
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
}
//# sourceMappingURL=abandoned-cart.d.ts.map