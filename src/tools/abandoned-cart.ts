import { InputDetector } from "../utils/input-detector";
import { ProductDetector } from "../utils/product-detector";
import { TotalExtractor } from "../utils/total-extractor";
import { SupabaseService } from "../services/supabase-service";
import { SDKOptions, CartSessionPayload, CheckoutCampaign } from "../types";

export class AbandonedCartTool {
    private options: SDKOptions;
    private supabaseService: SupabaseService;
    private inputDetector?: InputDetector;
    private productDetector?: ProductDetector;
    private totalExtractor?: TotalExtractor;
    private campaign?: CheckoutCampaign;
    private totalAverage: number = 0;
    private _sessionId?: string;
    private isInitialized = false;
    private previousContent: Record<string, any> = {};
    private previousProducts: any[] = [];
    private previousTotal: number = 0;
    private debounceTimer?: ReturnType<typeof setTimeout>;
    private pendingContentUpdate?: {
        content: Record<string, any>;
        sessionId?: string;
    };
    private isSubmitting = false; // Lock to prevent concurrent submissions

    constructor(options: SDKOptions) {
        this.options = options;
        this.supabaseService = new SupabaseService(
            options.supabaseUrl,
            options.supabaseAnonKey
        );
    }

    async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            return true;
        }

        try {
            // Check for existing session ID in localStorage
            this.loadSessionIdFromStorage();

            // Check if checkout is completed and clean up session if needed
            if (this.options.config?.completedCheckout && this._sessionId) {
                await this.handleCompletedCheckout();
                return true; // Return early since checkout is completed
            }

            // Fetch campaign data from Supabase
            const campaign = await this.supabaseService.getCheckoutCampaign(
                this.options.checkoutCampaignId
            );

            this.totalAverage = campaign?.average_checkout_value
                ? campaign.average_checkout_value
                : 0;

            if (!campaign) {
                console.error("Failed to fetch checkout campaign data");
                return false;
            }

            // Store campaign for later use
            this.campaign = campaign;

            // Initialize input detector with the campaign's input mapping
            this.inputDetector = new InputDetector(campaign.input_mapping);

            // Only initialize product detector and total extractor for non-bookvisit campaigns
            // For bookvisit campaigns, we'll fetch products and totals from the API
            if (campaign.type !== "bookvisit") {
                // Initialize product detector with the campaign's product mapping
                this.productDetector = new ProductDetector(
                    campaign.product_mapping
                );

                // Initialize total extractor with the campaign's total selector
                this.totalExtractor = new TotalExtractor(campaign.total_selector);
            }

            // Set up the content update callback with debouncing
            this.inputDetector.setOnContentUpdate(
                this.debouncedHandleContentUpdate.bind(this)
            );

            // Set session ID if we have one from localStorage
            if (this._sessionId) {
                this.inputDetector.setSessionId(this._sessionId);
            }

            // Start listening to input events
            this.inputDetector.startListening();

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error("Failed to initialize abandoned cart tool:", error);
            return false;
        }
    }

    /**
     * Debounced version of handleContentUpdate to prevent multiple rapid calls
     * from auto-fill operations from creating multiple session IDs
     */
    private debouncedHandleContentUpdate(
        content: Record<string, any>,
        sessionId?: string
    ) {
        // Store the latest content update
        this.pendingContentUpdate = { content, sessionId };

        // Clear existing timer if any
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Set a new timer to process the update after a delay
        // This batches rapid auto-fill events into a single update
        this.debounceTimer = setTimeout(() => {
            if (this.pendingContentUpdate) {
                this.handleContentUpdate(
                    this.pendingContentUpdate.content,
                    this.pendingContentUpdate.sessionId
                );
                this.pendingContentUpdate = undefined;
            }
        }, 300); // 300ms debounce delay
    }

    private async handleContentUpdate(
        content: Record<string, any>,
        sessionId?: string
    ) {
        // Prevent concurrent submissions to avoid duplicate sessions
        if (this.isSubmitting) {
            // Re-queue this update to be processed after current submission completes
            this.pendingContentUpdate = { content, sessionId };
            // Set a timer to retry after a short delay
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(() => {
                if (this.pendingContentUpdate) {
                    this.handleContentUpdate(
                        this.pendingContentUpdate.content,
                        this.pendingContentUpdate.sessionId
                    );
                }
            }, 100); // Short retry delay
            return;
        }

        try {
            // For bookvisit campaigns, fetch products and total from API
            // For other campaigns, use the traditional selector-based approach
            let products: any[] = [];
            let total: number = this.totalAverage;

            if (this.campaign?.type === "bookvisit") {
                const bookvisitData = await this.fetchBookVisitBasket();
                if (bookvisitData) {
                    products = bookvisitData.products;
                    total = bookvisitData.total;
                }
            } else {
                // Detect products on the page using selectors
                products = this.productDetector?.detectProducts() || [];

                // Extract cart total using selector
                total = this.totalExtractor?.extractTotal() || this.totalAverage;
            }

            // Check if content has actually changed
            const contentChanged = this.hasContentChanged(
                content,
                products,
                total
            );

            if (!contentChanged) {
                console.log("Content unchanged, skipping upload");
                return;
            }

            // Set lock to prevent concurrent submissions
            this.isSubmitting = true;

            // Get current page URL with query parameters
            const currentUrl =
                typeof window !== "undefined" ? window.location.href : "";

            // Always prioritize this._sessionId if it exists (from previous successful submission or localStorage)
            // This ensures we update existing sessions instead of creating duplicates
            const effectiveSessionId = this._sessionId || sessionId;

            const payload: CartSessionPayload = {
                organization_id: this.options.organizationId,
                checkout_campaign_id: this.options.checkoutCampaignId,
                content: content,
                products: products,
                url: currentUrl,
                total: total,
                id: effectiveSessionId,
            };

            const response = await this.supabaseService.submitCartSession(
                payload
            );

            if (response && response.id) {
                // Store the session ID for future updates
                this._sessionId = response.id;
                this.inputDetector?.setSessionId(response.id);

                // Store session ID in localStorage for persistence
                this.saveSessionIdToStorage(response.id);

                // Update previous content after successful upload
                this.previousContent = { ...content };
                this.previousProducts = [...products];
                this.previousTotal = total;

                console.log("Cart session updated successfully:", response.id);
            } else {
                console.error("Failed to submit cart session");
            }
        } catch (error) {
            console.error("Error handling content update:", error);
        } finally {
            // Always release the lock, even if there was an error
            this.isSubmitting = false;
        }
    }

    private hasContentChanged(
        content: Record<string, any>,
        products: any[],
        total: number
    ): boolean {
        // If this is the first update (previousContent is empty), always consider it changed
        if (
            Object.keys(this.previousContent).length === 0 &&
            this.previousProducts.length === 0 &&
            this.previousTotal === 0
        ) {
            return true;
        }

        // Check if content has changed
        const contentChanged =
            JSON.stringify(content) !== JSON.stringify(this.previousContent);

        // Check if products have changed
        const productsChanged =
            JSON.stringify(products) !== JSON.stringify(this.previousProducts);

        // Check if total has changed
        const totalChanged = total !== this.previousTotal;

        return contentChanged || productsChanged || totalChanged;
    }

    public destroy(): void {
        // Clear any pending debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = undefined;
        }

        // Process any pending content update before destroying
        if (this.pendingContentUpdate) {
            this.handleContentUpdate(
                this.pendingContentUpdate.content,
                this.pendingContentUpdate.sessionId
            );
            this.pendingContentUpdate = undefined;
        }

        if (this.inputDetector) {
            this.inputDetector.stopListening();
        }
        this.isInitialized = false;
        this._sessionId = undefined;
        this.isSubmitting = false; // Reset lock

        // Clear session ID from localStorage
        this.clearSessionIdFromStorage();
    }

    public getContent(): Record<string, any> {
        return this.inputDetector?.getContent() || {};
    }

    public hasEmailOrPhone(): boolean {
        return this.inputDetector?.hasEmailOrPhoneNumber() || false;
    }

    public getSessionId(): string | undefined {
        return this._sessionId;
    }

    /**
     * Reset the change tracking to force the next update to be uploaded
     * Useful for testing or when you want to ensure the latest data is uploaded
     */
    public resetChangeTracking(): void {
        this.previousContent = {};
        this.previousProducts = [];
        this.previousTotal = 0;
        console.log("Change tracking reset - next update will be uploaded");
    }

    /**
     * Load session ID from localStorage
     */
    private loadSessionIdFromStorage(): void {
        if (typeof window !== "undefined" && window.localStorage) {
            try {
                const storedSessionId = localStorage.getItem("ei_session_id");
                if (storedSessionId) {
                    this._sessionId = storedSessionId;
                    console.log(
                        "Loaded session ID from localStorage:",
                        storedSessionId
                    );
                }
            } catch (error) {
                console.warn(
                    "Failed to load session ID from localStorage:",
                    error
                );
            }
        }
    }

    /**
     * Save session ID to localStorage
     */
    private saveSessionIdToStorage(sessionId: string): void {
        if (typeof window !== "undefined" && window.localStorage) {
            try {
                localStorage.setItem("ei_session_id", sessionId);
                console.log("Saved session ID to localStorage:", sessionId);
            } catch (error) {
                console.warn(
                    "Failed to save session ID to localStorage:",
                    error
                );
            }
        }
    }

    /**
     * Clear session ID from localStorage
     */
    private clearSessionIdFromStorage(): void {
        if (typeof window !== "undefined" && window.localStorage) {
            try {
                localStorage.removeItem("ei_session_id");
                console.log("Cleared session ID from localStorage");
            } catch (error) {
                console.warn(
                    "Failed to clear session ID from localStorage:",
                    error
                );
            }
        }
    }

    /**
     * Handle completed checkout by deleting the session from database and clearing localStorage
     */
    private async handleCompletedCheckout(): Promise<void> {
        if (!this._sessionId) {
            console.log("No session ID found for completed checkout cleanup");
            return;
        }

        try {
            // Delete the session from the database
            const deleted = await this.supabaseService.deleteCartSession(
                this._sessionId
            );

            if (deleted) {
                console.log(
                    "Successfully deleted completed checkout session:",
                    this._sessionId
                );
            } else {
                console.warn(
                    "Failed to delete completed checkout session from database"
                );
            }
        } catch (error) {
            console.error("Error deleting completed checkout session:", error);
        } finally {
            // Always clear the session from localStorage and memory, even if database deletion failed
            this.clearSessionIdFromStorage();
            this._sessionId = undefined;
            console.log("Completed checkout cleanup finished");
        }
    }

    /**
     * Fetch basket data from BookVisit API
     */
    private async fetchBookVisitBasket(): Promise<{
        products: any[];
        total: number;
    } | null> {
        if (!this.campaign || this.campaign.type !== "bookvisit") {
            return null;
        }

        const channelId = this.campaign.config?.bookvisit?.channel_id;
        if (!channelId) {
            console.error("BookVisit channel_id not found in campaign config");
            return null;
        }

        // Get JWT token from cookies
        const jwtToken = this.getCookie("bv_jwt");
        if (!jwtToken) {
            console.warn("BookVisit JWT token not found in cookies");
            return null;
        }

        try {
            const url = `https://restapi.bookvisit.com/baskets/basket-v1?IncludePaymentHistory=false&ChannelId=${channelId}`;
            const response = await fetch(url, {
                credentials: "include",
                headers: {
                    authorization: `Bearer ${jwtToken}`,
                },
            });

            if (!response.ok) {
                console.error(
                    `BookVisit API error: ${response.status} ${response.statusText}`
                );
                return null;
            }

            const data = await response.json();
            return this.extractBookVisitProductsAndTotal(data);
        } catch (error) {
            console.error("Error fetching BookVisit basket:", error);
            return null;
        }
    }

    /**
     * Extract products and total from BookVisit API response
     */
    private extractBookVisitProductsAndTotal(data: any): {
        products: any[];
        total: number;
    } {
        const products: any[] = [];
        let total = 0;

        try {
            const bookingData = data?.booking?.bookingData;
            if (!bookingData) {
                return { products, total };
            }

            // Extract total price
            total = bookingData.totalPrice || 0;

            // Extract products from rooms
            const rooms = bookingData.rooms || [];
            const roomDescriptions = bookingData.roomDescriptions || [];
            const addOnDescriptions = bookingData.addOnDescriptions || [];

            rooms.forEach((room: any) => {
                // Find room description
                const roomDescription = roomDescriptions.find(
                    (desc: any) => desc.id === room.roomId
                );

                // Calculate room price
                const roomPrice = room.totalPrice || 0;

                // Create product from room
                const product: any = {
                    id: room.roomId,
                    name: roomDescription?.name || "Room",
                    price: roomPrice,
                    quantity: 1,
                    type: "room",
                    startDate: room.startDate,
                    endDate: room.endDate,
                    roomConfig: room.roomConfig,
                };

                // Add rate plan information if available
                if (room.priceInfo && room.priceInfo.length > 0) {
                    const ratePlanId = room.priceInfo[0].ratePlanId;
                    const ratePlanDescription = bookingData.ratePlanDescriptions?.find(
                        (desc: any) => desc.id === ratePlanId
                    );
                    if (ratePlanDescription) {
                        product.ratePlan = ratePlanDescription.name;
                    }
                }

                products.push(product);

                // Add mandatory add-ons as separate products if they have a price
                // Only include add-ons that are not included in the room rate or have a separate charge
                const mandatoryAddOns = room.mandatoryAddOns || [];

                mandatoryAddOns.forEach((addOn: any) => {
                    // Include add-ons that have a total price > 0 (charged separately)
                    const addOnTotalPrice = addOn.totalPrice || 0;
                    if (addOnTotalPrice > 0) {
                        const addOnDescription = addOnDescriptions.find(
                            (desc: any) => desc.id === addOn.addOnId
                        );

                        products.push({
                            id: addOn.addOnId,
                            name: addOnDescription?.name || "Add-on",
                            price: addOnTotalPrice,
                            quantity: addOn.numberOfUnits || 1,
                            type: "addon",
                            roomId: room.roomId,
                            date: addOn.date,
                        });
                    }
                });
            });

            // Also include optional add-ons from bookingData if they exist
            const optionalAddOns = bookingData.optionalAddOns || [];

            optionalAddOns.forEach((addOn: any) => {
                const addOnTotalPrice = addOn.totalPrice || 0;
                if (addOnTotalPrice > 0) {
                    const addOnDescription = addOnDescriptions.find(
                        (desc: any) => desc.id === addOn.addOnId
                    );

                    products.push({
                        id: addOn.addOnId,
                        name: addOnDescription?.name || "Add-on",
                        price: addOnTotalPrice,
                        quantity: addOn.numberOfUnits || 1,
                        type: "addon",
                        roomId: addOn.roomId,
                        date: addOn.date,
                    });
                }
            });
        } catch (error) {
            console.error("Error extracting BookVisit products and total:", error);
        }

        return { products, total };
    }

    /**
     * Get cookie value by name
     */
    private getCookie(name: string): string | null {
        if (typeof document === "undefined") {
            return null;
        }

        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop()?.split(";").shift() || null;
        }
        return null;
    }
}
