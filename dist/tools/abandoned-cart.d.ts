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
    constructor(options: SDKOptions);
    initialize(): Promise<boolean>;
    /**
     * Debounced version of handleContentUpdate to prevent multiple rapid calls
     * from auto-fill operations from creating multiple session IDs
     */
    private debouncedHandleContentUpdate;
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
    /**
     * Fetch basket data from BookVisit API
     */
    private fetchBookVisitBasket;
    /**
     * Extract products and total from BookVisit API response
     */
    private extractBookVisitProductsAndTotal;
    /**
     * Inject autofields for BookVisit campaigns
     */
    private injectBookVisitAutofields;
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
     * Get cookie value by name
     */
    private getCookie;
    /**
     * Add direct listeners to autofields to ensure they're detected by InputDetector
     * This is necessary because InputDetector might use specific selectors that don't match autofields
     */
    private addDirectAutofieldListeners;
    /**
     * Handle blur event on autofield inputs
     * Manually triggers the content update callback to ensure autofields are detected
     */
    private handleAutofieldBlur;
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
     */
    private fillPaymentPageFields;
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