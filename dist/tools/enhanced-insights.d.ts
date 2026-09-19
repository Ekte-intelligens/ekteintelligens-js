import { SDKOptions } from '../types';

interface PageVisit {
    page: string;
    enteredAt: number;
    leftAt?: number;
    /**
     * Milliseconds the page was actually in the foreground, summed across
     * every visible segment of the visit. A visit is paused when the tab goes
     * hidden and resumed when it comes back, so time after a tab switch is
     * still counted — leftAt - enteredAt alone stopped at the first blur.
     */
    activeMs?: number;
}
interface EnhancedInsightsData {
    visits: PageVisit[];
}
export declare class EnhancedInsightsTool {
    private options;
    private isInitialized;
    private currentPage;
    private currentVisitStartTime;
    /** Start of the current foreground segment; 0 while paused. */
    private segmentStart;
    private data;
    private storageKey;
    private popstateHandler?;
    private beforeunloadHandler?;
    private visibilityChangeHandler?;
    private originalPushState?;
    private originalReplaceState?;
    constructor(options: SDKOptions);
    initialize(): Promise<boolean>;
    /**
     * The visit currently being recorded. Looked up by identity rather than
     * held as a reference because getData()/getVisits() reload `this.data`
     * from storage and would orphan a stored reference. Deliberately does NOT
     * filter on `!leftAt`: a paused visit has one, and skipping it was what
     * dropped every second after the first tab switch.
     */
    private currentVisitRef;
    private trackPageEntry;
    /** Bank the foreground segment so far; the visit can still be resumed. */
    private pauseCurrentVisit;
    /** Start a new foreground segment after the tab became visible again. */
    private resumeCurrentVisit;
    private trackPageExit;
    private setupNavigationListeners;
    private setupExitTracking;
    private loadDataFromStorage;
    private saveDataToStorage;
    getData(): EnhancedInsightsData;
    getVisits(): PageVisit[];
    clearData(): void;
    destroy(): void;
}
export {};
//# sourceMappingURL=enhanced-insights.d.ts.map