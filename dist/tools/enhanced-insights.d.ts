import { SDKOptions } from '../types';

interface PageVisit {
    page: string;
    enteredAt: number;
    leftAt?: number;
}
interface EnhancedInsightsData {
    visits: PageVisit[];
}
export declare class EnhancedInsightsTool {
    private options;
    private isInitialized;
    private currentPage;
    private currentVisitStartTime;
    private data;
    private storageKey;
    private popstateHandler?;
    private beforeunloadHandler?;
    private visibilityChangeHandler?;
    private originalPushState?;
    private originalReplaceState?;
    constructor(options: SDKOptions);
    initialize(): Promise<boolean>;
    private trackPageEntry;
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