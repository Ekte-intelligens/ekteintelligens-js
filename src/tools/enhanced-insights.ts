import { SDKOptions } from "../types";
import { updateInsightsSummaryCookie } from "../utils/analytics-collector";

interface PageVisit {
    page: string;
    enteredAt: number;
    leftAt?: number;
}

interface EnhancedInsightsData {
    visits: PageVisit[];
}

export class EnhancedInsightsTool {
    // @ts-ignore
    private options: SDKOptions;
    private isInitialized = false;
    private currentPage: string = "";
    private currentVisitStartTime: number = 0;
    private data: EnhancedInsightsData = { visits: [] };
    private storageKey = "ei_enhanced_insights";
    private popstateHandler?: () => void;
    // private pushstateHandler?: () => void;
    // private replacestateHandler?: () => void;
    private beforeunloadHandler?: () => void;
    private visibilityChangeHandler?: () => void;
    private originalPushState?: typeof history.pushState;
    private originalReplaceState?: typeof history.replaceState;

    constructor(options: SDKOptions) {
        this.options = options;
    }

    async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            return true;
        }

        try {
            // Load existing data from localStorage
            this.loadDataFromStorage();

            // Track initial page load
            this.trackPageEntry();

            // Set up event listeners for navigation
            this.setupNavigationListeners();

            // Set up page exit tracking
            this.setupExitTracking();

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error(
                "Failed to initialize enhanced insights tool:",
                error
            );
            return false;
        }
    }

    private trackPageEntry(): void {
        if (typeof window === "undefined") {
            return;
        }

        // const currentUrl = window.location.href;
        const currentPath = window.location.pathname + window.location.search;

        // If we're already on a page, mark the previous page as exited
        if (this.currentPage && this.currentVisitStartTime > 0) {
            this.trackPageExit();
        }

        // Track new page entry
        this.currentPage = currentPath;
        this.currentVisitStartTime = Date.now();

        const visit: PageVisit = {
            page: currentPath,
            enteredAt: this.currentVisitStartTime,
        };

        this.data.visits.push(visit);
        this.saveDataToStorage();
    }

    private trackPageExit(): void {
        if (!this.currentPage || this.currentVisitStartTime === 0) {
            return;
        }

        // Find the current visit and update it with exit time
        const currentVisit = this.data.visits.find(
            (visit) =>
                visit.page === this.currentPage &&
                visit.enteredAt === this.currentVisitStartTime &&
                !visit.leftAt
        );

        if (currentVisit) {
            currentVisit.leftAt = Date.now();
            this.saveDataToStorage();
        }
    }

    private setupNavigationListeners(): void {
        if (typeof window === "undefined") {
            return;
        }

        // Listen to browser back/forward buttons
        this.popstateHandler = () => {
            this.trackPageEntry();
        };
        window.addEventListener("popstate", this.popstateHandler);

        // Intercept pushState and replaceState for SPA navigation
        this.originalPushState = history.pushState;
        this.originalReplaceState = history.replaceState;

        const self = this;
        history.pushState = function (
            ...args: Parameters<typeof history.pushState>
        ) {
            self.trackPageExit();
            const result = self.originalPushState!.apply(history, args);
            // Use setTimeout to ensure the URL has updated
            setTimeout(() => {
                self.trackPageEntry();
            }, 0);
            return result;
        };

        history.replaceState = function (
            ...args: Parameters<typeof history.replaceState>
        ) {
            self.trackPageExit();
            const result = self.originalReplaceState!.apply(history, args);
            // Use setTimeout to ensure the URL has updated
            setTimeout(() => {
                self.trackPageEntry();
            }, 0);
            return result;
        };
    }

    private setupExitTracking(): void {
        if (typeof window === "undefined") {
            return;
        }

        // Track page exit on beforeunload (page close/refresh)
        this.beforeunloadHandler = () => {
            this.trackPageExit();
        };
        window.addEventListener("beforeunload", this.beforeunloadHandler);

        // Track page exit when tab becomes hidden (more reliable for mobile)
        this.visibilityChangeHandler = () => {
            if (document.visibilityState === "hidden") {
                this.trackPageExit();
            } else if (document.visibilityState === "visible") {
                // Page became visible again - only track entry if page actually changed
                // (user might have switched tabs and come back to same page)
                const currentPath =
                    window.location.pathname + window.location.search;
                if (currentPath !== this.currentPage) {
                    this.trackPageEntry();
                }
            }
        };
        document.addEventListener(
            "visibilitychange",
            this.visibilityChangeHandler
        );
    }

    private loadDataFromStorage(): void {
        if (typeof window === "undefined" || !window.localStorage) {
            return;
        }

        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.data = JSON.parse(stored);
                // Ensure visits is an array
                if (!Array.isArray(this.data.visits)) {
                    this.data.visits = [];
                }
            } else {
                this.data = { visits: [] };
            }
        } catch (error) {
            console.warn(
                "Failed to load enhanced insights data from localStorage:",
                error
            );
            this.data = { visits: [] };
        }
    }

    private saveDataToStorage(): void {
        if (typeof window === "undefined" || !window.localStorage) {
            return;
        }

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (error) {
            console.warn(
                "Failed to save enhanced insights data to localStorage:",
                error
            );
        }
        // Mirror a compact summary into the cross-subdomain ei_insights
        // cookie; no-op unless shareInsightsAcrossSubdomains is enabled and
        // consent allows persistence.
        updateInsightsSummaryCookie();
    }

    public getData(): EnhancedInsightsData {
        // Reload from storage to get latest data
        this.loadDataFromStorage();
        return { ...this.data };
    }

    public getVisits(): PageVisit[] {
        // Reload from storage to get latest data
        this.loadDataFromStorage();
        return [...this.data.visits];
    }

    public clearData(): void {
        this.data = { visits: [] };
        this.saveDataToStorage();
    }

    public destroy(): void {
        // Track exit of current page
        this.trackPageExit();

        // Remove event listeners
        if (typeof window !== "undefined") {
            if (this.popstateHandler) {
                window.removeEventListener("popstate", this.popstateHandler);
            }

            if (this.beforeunloadHandler) {
                window.removeEventListener(
                    "beforeunload",
                    this.beforeunloadHandler
                );
            }

            if (this.visibilityChangeHandler) {
                document.removeEventListener(
                    "visibilitychange",
                    this.visibilityChangeHandler
                );
            }

            // Restore original history methods
            if (this.originalPushState) {
                history.pushState = this.originalPushState;
            }
            if (this.originalReplaceState) {
                history.replaceState = this.originalReplaceState;
            }
        }

        this.isInitialized = false;
        this.currentPage = "";
        this.currentVisitStartTime = 0;
    }
}
