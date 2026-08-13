import { InputDetector } from "../utils/input-detector";
import { ProductDetector } from "../utils/product-detector";
import { TotalExtractor } from "../utils/total-extractor";
import { SupabaseService } from "../services/supabase-service";
import { collectAnalytics } from "../utils/analytics-collector";
import {
    SDKOptions,
    CartSessionPayload,
    CheckoutCampaign,
    InputMapping,
} from "../types";

let hasInitializedAutofields = false;

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
    private autofieldStorageListenersSetup = false; // Flag to prevent duplicate storage listeners

    constructor(options: SDKOptions) {
        this.options = options;
        this.supabaseService = new SupabaseService(
            options.supabaseUrl,
            options.supabaseAnonKey,
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
                this.options.checkoutCampaignId,
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
            if (
                campaign.type !== "bookvisit" &&
                campaign.type !== "synxis" &&
                campaign.type !== "elinapms"
            ) {
                // Initialize product detector with the campaign's product mapping
                this.productDetector = new ProductDetector(
                    campaign.product_mapping,
                );

                // Initialize total extractor with the campaign's total selector
                this.totalExtractor = new TotalExtractor(
                    campaign.total_selector,
                );
            }

            // Set up the content update callback with debouncing
            this.inputDetector.setOnContentUpdate(
                this.debouncedHandleContentUpdate.bind(this),
            );

            // Set session ID if we have one from localStorage
            if (this._sessionId) {
                this.inputDetector.setSessionId(this._sessionId);
            }

            // Inject autofields for bookvisit campaigns if enabled
            // This must happen before startListening() so autofields are in the DOM
            if (
                campaign.type === "bookvisit" &&
                campaign.config?.bookvisit?.autofields === true &&
                window.location.pathname === "/checkout" &&
                !hasInitializedAutofields
            ) {
                hasInitializedAutofields = true;
                this.injectBookVisitAutofields(campaign.input_mapping);
            }

            // Check if we're on the payment page and fill in fields from sessionStorage
            this.checkAndFillPaymentPageFields();

            // Start listening to input events
            // This happens after autofields are injected, so they'll be included if input mapping allows
            this.inputDetector.startListening();

            // Set up URL change listener for SPA navigation
            this.setupUrlChangeListener();

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
        sessionId?: string,
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
                    this.pendingContentUpdate.sessionId,
                );
                this.pendingContentUpdate = undefined;
            }
        }, 300); // 300ms debounce delay
    }

    private async handleContentUpdate(
        content: Record<string, any>,
        sessionId?: string,
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
                        this.pendingContentUpdate.sessionId,
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
            } else if (this.campaign?.type === "synxis") {
                const synxisData = await this.fetchSynxisBasket();
                if (synxisData) {
                    products = synxisData.products;
                    total = synxisData.total;
                }
            } else if (this.campaign?.type === "elinapms") {
                const elinaData = await this.fetchElinapmsBasket();
                if (elinaData) {
                    products = elinaData.products;
                    total = elinaData.total;
                }
            } else {
                // Detect products on the page using selectors
                products = this.productDetector?.detectProducts() || [];

                // Extract cart total using selector
                total =
                    this.totalExtractor?.extractTotal() || this.totalAverage;
            }

            // Check if content has actually changed
            const contentChanged = this.hasContentChanged(
                content,
                products,
                total,
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

            // Re-collected on every upload so the enhanced_insights snapshot
            // tracks the visit as it unfolds; the edge function only writes
            // the column when a value is present.
            const analytics = collectAnalytics();

            const payload: CartSessionPayload = {
                organization_id: this.options.organizationId,
                checkout_campaign_id: this.options.checkoutCampaignId,
                content: content,
                products: products,
                url: currentUrl,
                total: total,
                id: effectiveSessionId,
                ...(analytics ? { analytics } : {}),
                ...(this.campaign?.type === "synxis" &&
                (this as any)._synxisSessionIds
                    ? { metadata: (this as any)._synxisSessionIds }
                    : {}),
                ...(this.campaign?.type === "elinapms" &&
                (this as any)._elinapmsSessionIds
                    ? { metadata: (this as any)._elinapmsSessionIds }
                    : {}),
            };

            const response =
                await this.supabaseService.submitCartSession(payload);

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
        total: number,
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

        // Clear URL check interval if it exists
        if ((this as any)._urlCheckInterval) {
            clearInterval((this as any)._urlCheckInterval);
            (this as any)._urlCheckInterval = undefined;
        }

        // Disconnect iframe observer if it exists
        if ((this as any)._iframeObserver) {
            (this as any)._iframeObserver.disconnect();
            (this as any)._iframeObserver = undefined;
        }

        // Process any pending content update before destroying
        if (this.pendingContentUpdate) {
            this.handleContentUpdate(
                this.pendingContentUpdate.content,
                this.pendingContentUpdate.sessionId,
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
                        storedSessionId,
                    );
                }
            } catch (error) {
                console.warn(
                    "Failed to load session ID from localStorage:",
                    error,
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
                    error,
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
                    error,
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
                this._sessionId,
            );

            if (deleted) {
                console.log(
                    "Successfully deleted completed checkout session:",
                    this._sessionId,
                );
            } else {
                console.warn(
                    "Failed to delete completed checkout session from database",
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
                    `BookVisit API error: ${response.status} ${response.statusText}`,
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
                    (desc: any) => desc.id === room.roomId,
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
                    const ratePlanDescription =
                        bookingData.ratePlanDescriptions?.find(
                            (desc: any) => desc.id === ratePlanId,
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
                            (desc: any) => desc.id === addOn.addOnId,
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
                        (desc: any) => desc.id === addOn.addOnId,
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
            console.error(
                "Error extracting BookVisit products and total:",
                error,
            );
        }

        return { products, total };
    }

    /**
     * Inject autofields for BookVisit campaigns
     */
    private injectBookVisitAutofields(inputMapping: InputMapping | null): void {
        if (typeof document === "undefined") {
            return;
        }

        // Find the target container
        const container = document.getElementById("main_content_container");
        if (!container) {
            console.warn(
                "main_content_container not found, cannot inject autofields",
            );
            return;
        }

        // Determine which fields to include based on input_mapping
        const fieldsToInclude = this.getFieldsToInclude(inputMapping);
        if (fieldsToInclude.length === 0) {
            console.log(
                "No relevant fields found in input_mapping for autofields",
            );
            return;
        }

        // Create the form section HTML
        const formSection = this.createBookVisitFormSection(fieldsToInclude);

        // Insert at the top of the container
        container.insertAdjacentHTML("afterbegin", formSection);

        // Set up listeners for autofields (both for InputDetector and sessionStorage)
        // Use a retry mechanism to ensure fields are found
        this.setupAutofieldListenersWithRetry();
    }

    /**
     * Determine which fields to include based on input_mapping
     */
    private getFieldsToInclude(inputMapping: InputMapping | null): string[] {
        const fields: string[] = [];
        const fieldMappings = inputMapping?.field_mappings || {};
        const inputSelectors = inputMapping?.inputs || [];

        // Check for firstName - values in field_mappings are system mappings (first_name)
        if (
            this.hasFieldMapping(fieldMappings, ["first_name"]) ||
            this.hasInputSelector(inputSelectors, [
                "firstName",
                "firstname",
                "first_name",
                "given-name",
            ])
        ) {
            fields.push("firstName");
        }

        // Check for lastName - values in field_mappings are system mappings (last_name)
        if (
            this.hasFieldMapping(fieldMappings, ["last_name"]) ||
            this.hasInputSelector(inputSelectors, [
                "lastName",
                "lastname",
                "last_name",
                "family-name",
            ])
        ) {
            fields.push("lastName");
        }

        // Check for email - values in field_mappings are system mappings (email)
        if (
            this.hasFieldMapping(fieldMappings, ["email"]) ||
            this.hasInputSelector(inputSelectors, [
                "email",
                "emailAddress",
                "email_address",
                "e-mail",
            ])
        ) {
            fields.push("email");
        }

        // Check for phoneNumber - values in field_mappings are system mappings (phone_number)
        if (
            this.hasFieldMapping(fieldMappings, ["phone_number"]) ||
            this.hasInputSelector(inputSelectors, [
                "phoneNumber",
                "phonenumber",
                "phone_number",
                "phone",
                "tel",
                "telephone",
            ])
        ) {
            fields.push("phoneNumber");
        }

        // If no fields found but autofields is enabled, include all four by default
        // This ensures we always inject something useful
        if (fields.length === 0) {
            return ["firstName", "lastName", "email", "phoneNumber"];
        }

        return fields;
    }

    /**
     * Check if any of the target field names exist in the field mappings
     * The values (not keys) represent the system mappings (first_name, last_name, phone_number, email)
     */
    private hasFieldMapping(
        fieldMappings: Record<string, string>,
        targetNames: string[],
    ): boolean {
        // Check the values (system mappings) primarily, as they represent the standardized field names
        for (const value of Object.values(fieldMappings)) {
            const valueLower = value.toLowerCase();
            for (const target of targetNames) {
                const targetLower = target.toLowerCase();
                // Primary check: value matches (system mapping)
                if (valueLower === targetLower) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Check if any of the target field names exist in the input selectors
     */
    private hasInputSelector(
        inputSelectors: string[],
        targetNames: string[],
    ): boolean {
        for (const selector of inputSelectors) {
            const selectorLower = selector.toLowerCase();
            for (const target of targetNames) {
                const targetLower = target.toLowerCase();
                if (selectorLower.includes(targetLower)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Get the user's locale from browser settings
     */
    private getUserLocale(): string {
        if (typeof navigator === "undefined") {
            return "en"; // Default to English if navigator is not available
        }

        // Try to get locale from navigator.languages (preferred languages)
        if (navigator.languages && navigator.languages.length > 0) {
            const locale = navigator.languages[0];
            // Extract language code (e.g., "en-US" -> "en", "nb-NO" -> "nb")
            return locale.split("-")[0].toLowerCase();
        }

        // Fallback to navigator.language
        if (navigator.language) {
            return navigator.language.split("-")[0].toLowerCase();
        }

        return "en"; // Default to English
    }

    /**
     * Get localized text for email and phone number fields
     */
    private getLocalizedText(key: "email" | "phoneNumber"): string {
        const locale = this.getUserLocale();

        // Translation map for email and phone number
        const translations: Record<string, Record<string, string>> = {
            email: {
                en: "Email",
                nb: "E-post", // Norwegian Bokmål
                nn: "E-post", // Norwegian Nynorsk
                no: "E-post", // Norwegian (generic)
                sv: "E-post", // Swedish
                da: "E-mail", // Danish
                de: "E-Mail", // German
                fr: "E-mail", // French
                es: "Correo electrónico", // Spanish
                it: "E-mail", // Italian
                nl: "E-mail", // Dutch
                pl: "E-mail", // Polish
            },
            phoneNumber: {
                en: "Phone number",
                nb: "Telefonnummer", // Norwegian Bokmål
                nn: "Telefonnummer", // Norwegian Nynorsk
                no: "Telefonnummer", // Norwegian (generic)
                sv: "Telefonnummer", // Swedish
                da: "Telefonnummer", // Danish
                de: "Telefonnummer", // German
                fr: "Numéro de téléphone", // French
                es: "Número de teléfono", // Spanish
                it: "Numero di telefono", // Italian
                nl: "Telefoonnummer", // Dutch
                pl: "Numer telefonu", // Polish
            },
        };

        // Get translation for the locale, default to English if locale is unknown
        const localeTranslation = translations[key][locale];
        if (localeTranslation) {
            return localeTranslation;
        }

        // Default to English for unknown locales
        return translations[key]["en"] || key;
    }

    /**
     * Create the BookVisit form section HTML
     */
    private createBookVisitFormSection(fields: string[]): string {
        const hasFirstName = fields.includes("firstName");
        const hasLastName = fields.includes("lastName");
        const hasEmail = fields.includes("email");
        const hasPhone = fields.includes("phoneNumber");

        // Get localized text for email and phone number
        const emailLabel = this.getLocalizedText("email");
        const phoneLabel = this.getLocalizedText("phoneNumber");

        // Build the input fields HTML - all in one grid
        let inputFieldsHtml =
            '<div class="bv-m-0 bv-grid bv-gap-[10px] bv-grid-cols-[minmax(0,1fr)_minmax(0,1fr)] bv-mt-[20px] bv_small:bv-grid-cols-1">';

        if (hasFirstName) {
            inputFieldsHtml += `
                <div class="bv-relative bv-w-full">
                    <input autocomplete="given-name" class="bv-box-border bv-flex bv-h-[40px] bv-w-full bv-pl-[14px] bv-rounded-bv_inputRoundedCorners bv-border-solid bv-bv_inputBorder disabled:bv-cursor-not-allowed disabled:bv-opacity-50 bv-font-bv_bodyFontFamily bv-text-bv_bodyFontSize placeholder:bv-text-bv_inputColor/30 focus:!bv-outline-none focus:bv-ring-2 bv-bg-bv_inputBackground bv-text-bv_inputColor" data-testid="customer_info_form_firstname" placeholder="Fornavn *" name="firstName">
                </div>
            `;
        }

        if (hasLastName) {
            inputFieldsHtml += `
                <div class="bv-relative bv-w-full">
                    <input autocomplete="family-name" class="bv-box-border bv-flex bv-h-[40px] bv-w-full bv-pl-[14px] bv-rounded-bv_inputRoundedCorners bv-border-solid bv-bv_inputBorder disabled:bv-cursor-not-allowed disabled:bv-opacity-50 bv-font-bv_bodyFontFamily bv-text-bv_bodyFontSize placeholder:bv-text-bv_inputColor/30 focus:!bv-outline-none focus:bv-ring-2 bv-bg-bv_inputBackground bv-text-bv_inputColor" data-testid="customer_info_form_lastname" placeholder="Etternavn *" name="lastName">
                </div>
            `;
        }

        if (hasEmail) {
            inputFieldsHtml += `
                <div class="bv-relative bv-w-full">
                    <input autocomplete="email" class="bv-box-border bv-flex bv-h-[40px] bv-w-full bv-pl-[14px] bv-rounded-bv_inputRoundedCorners bv-border-solid bv-bv_inputBorder disabled:bv-cursor-not-allowed disabled:bv-opacity-50 bv-font-bv_bodyFontFamily bv-text-bv_bodyFontSize placeholder:bv-text-bv_inputColor/30 focus:!bv-outline-none focus:bv-ring-2 bv-bg-bv_inputBackground bv-text-bv_inputColor" data-testid="customer_info_form_email" placeholder="${emailLabel} *" type="email" name="emailAddress">
                </div>
            `;
        }

        if (hasPhone) {
            inputFieldsHtml += `
                <div class="bv-relative" data-testid="customer_info_form_phone_number">
                    <div class="bv-flex bv-flex-col bv-justify-start">
                        <div class="bv-flex bv-flex-row bv-flex-nowrap bv-items-center bv-justify-start bv-gap-[8px]">
                            <div class="bv-relative bv-m-0 bv-min-w-[80px] bv-max-w-[80px] bv-p-0">
                                <span class="bv-absolute bv-top-1/2 bv-left-[6px] bv-z-[2] bv-block bv-w-auto bv-border-[2px] bv-border-solid bv-border-transparent bv-text-bv_inputColor bv-opacity-70 bv-shadow-none -bv-translate-y-1/2">
                                    <svg data-prefix="far" data-icon="plus" class="svg-inline--fa fa-plus " role="img" viewBox="0 0 448 512" aria-hidden="true">
                                        <path fill="currentColor" d="M248 56c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 176-176 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l176 0 0 176c0 13.3 10.7 24 24 24s24-10.7 24-24l0-176 176 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-176 0 0-176z"></path>
                                    </svg>
                                </span>
                                <div class="bv-relative bv-w-full">
                                    <input aria-label="${phoneLabel}" pattern="[0-9]" autocomplete="tel-country-code" class="bv-box-border bv-flex bv-h-[40px] bv-w-full bv-rounded-bv_inputRoundedCorners bv-border-solid bv-bv_inputBorder disabled:bv-cursor-not-allowed disabled:bv-opacity-50 bv-font-bv_bodyFontFamily bv-text-bv_bodyFontSize placeholder:bv-text-bv_inputColor/30 focus:!bv-outline-none focus:bv-ring-2 bv-bg-bv_inputBackground bv-text-bv_inputColor bv-min-w-[80px] bv-max-w-[80px] bv-pl-[26px]" data-testid="checkout_phonecountrycode" placeholder="" type="number" name="phoneCountryCode">
                                </div>
                            </div>
                            <div class="bv-relative bv-w-full">
                                <input pattern="[0-9]" aria-label="${phoneLabel}" autocomplete="tel-national" class="bv-box-border bv-flex bv-h-[40px] bv-pl-[14px] bv-rounded-bv_inputRoundedCorners bv-border-solid bv-bv_inputBorder disabled:bv-cursor-not-allowed disabled:bv-opacity-50 bv-font-bv_bodyFontFamily bv-text-bv_bodyFontSize placeholder:bv-text-bv_inputColor/30 focus:!bv-outline-none focus:bv-ring-2 bv-bg-bv_inputBackground bv-text-bv_inputColor bv-w-full" data-testid="checkout_phonenumber" placeholder="${phoneLabel} *" type="number" name="phoneNumber">
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        inputFieldsHtml += "</div>";

        // Build the complete section HTML
        const sectionHtml = `
            <div data-testid="checkout_responsible_for_booking_section" class="bv-mx-0 bv-px-0 bv-pt-0 bv-pb-[40px] bv-w-full" aria-label="Ansvarlig for bestilling" role="group" style="scroll-margin-top: 20px;">
                <div class="bv-mb-[15px] bv-flex bv-items-center bv-justify-between bv-gap-[15px]">
                    <div data-orientation="horizontal" role="none" class="bv-bg-bv_dividerBorderColor bv-h-bv_dividerBorderWidth bv-w-full bv-flex-1"></div>
                    <p class="bv-bv_text bv-font-bv_bodyBoldFontWeight bv-opacity-bv_bodyMutedOpacity bv-text-bv_bodyFontSize bv-font-bv_bodyFontFamily" role="group" tabindex="-1">Ansvarlig for bestilling</p>
                    <div data-orientation="horizontal" role="none" class="bv-bg-bv_dividerBorderColor bv-h-bv_dividerBorderWidth bv-w-full bv-flex-1"></div>
                </div>
                <div class="bv-rounded-bv_cardBorderRadius bv-border-bv_cardBorderWidth bv-border-bv_cardBorderColor bv-bg-bv_cardBackground bv-text-bv_cardColor bv-shadow-bv_cardBoxShadow bv_card bv-relative bv-border-solid bv-select-none [&_.bv_card]:bv-shadow-none [&_.bv_card]:bv-bg-bv_cardInnerBackground bv-p-[25px] bv_small:bv-p-[20px]" data-testid="customer_info_section">
                    ${inputFieldsHtml}
                </div>
            </div>
        `;

        return sectionHtml;
    }

    /**
     * Fetch basket data from SynXis cart API with dataLayer fallback
     */
    private async fetchSynxisBasket(): Promise<{
        products: any[];
        total: number;
    } | null> {
        if (!this.campaign || this.campaign.type !== "synxis") {
            return null;
        }

        const sessionIds = this.getSynxisSessionIds();
        if (sessionIds) {
            (this as any)._synxisSessionIds = sessionIds;
        }

        const cartResult = await this.fetchSynxisCartApi();
        if (cartResult) {
            return cartResult;
        }

        try {
            const dataLayer = this.getSynxisDataLayer();
            if (dataLayer && dataLayer.length > 0) {
                console.log(
                    "SynXis: Cart API unavailable, using dataLayer fallback",
                );
                return this.extractSynxisProductsFromDataLayer(dataLayer);
            }
        } catch (error) {
            console.error("SynXis: dataLayer fallback failed:", error);
        }

        return null;
    }

    /**
     * Fetch basket data from SynXis cart REST API
     */
    private async fetchSynxisCartApi(): Promise<{
        products: any[];
        total: number;
    } | null> {
        const cartId = this.getCookie("shoppingCartId");
        if (!cartId) {
            console.warn("SynXis: No shoppingCartId cookie found");
            return null;
        }

        try {
            const resp = await fetch(
                `/gw/v1/cart/${cartId}?businesscontext=BE`,
                {
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                },
            );

            if (!resp.ok) {
                console.error(
                    `SynXis cart API error: ${resp.status} ${resp.statusText}`,
                );
                return null;
            }

            const data = await resp.json();
            return this.extractSynxisCartApiData(data);
        } catch (error) {
            console.error("SynXis: Error fetching cart API:", error);
            return null;
        }
    }

    /**
     * Extract products and total from SynXis cart API response
     *
     * The /gw/v1/cart/ endpoint can return multiple pending reservations under
     * the same shoppingCartId cookie (accumulated from prior incomplete bookings).
     * We filter down to the reservation the user is actually checking out, matched
     * via the sbe_rc URL param (base64 UUID = reservation.id). Fallback: the
     * reservation with the highest itineraryNumber (most recently created).
     *
     * The API's Total.Amount is the list price, which doesn't reflect promo
     * discounts that the SBE applies client-side at reservation time. We override
     * the root `total` with the DOM-visible price (post-discount) and also expose
     * it per-product as `actualTotal` for reference.
     */
    private extractSynxisCartApiData(data: any): {
        products: any[];
        total: number;
    } {
        const products: any[] = [];
        let total = 0;

        const actualTotal = this.getSynxisActualTotal();
        const sessionIds = (this as any)._synxisSessionIds as
            | { sbeRcDecoded?: string | null }
            | undefined;

        try {
            const shoppingCarts = data?.ShoppingCart || [];

            const allReservations: Array<{
                resv: any;
                itineraryNumber: string;
            }> = [];
            for (const cart of shoppingCarts) {
                const reservations =
                    cart?.UpdatedData?.itinerary?.reservations || [];
                for (const resv of reservations) {
                    allReservations.push({
                        resv,
                        itineraryNumber: cart?.Itemid || "",
                    });
                }
            }

            let activeReservations = allReservations;
            if (sessionIds?.sbeRcDecoded) {
                const matched = allReservations.filter(
                    ({ resv }) => resv.id === sessionIds.sbeRcDecoded,
                );
                if (matched.length > 0) {
                    activeReservations = matched;
                }
            }
            if (
                activeReservations === allReservations &&
                allReservations.length > 1
            ) {
                activeReservations = [...allReservations]
                    .sort((a, b) =>
                        b.itineraryNumber.localeCompare(a.itineraryNumber),
                    )
                    .slice(0, 1);
            }

            for (const { resv } of activeReservations) {
                const extras = resv.extrasFromShopping || {};
                const stay = resv.stayCriteria || {};
                const guests = resv.guestCriteria || {};
                const prices = extras.prices || {};

                const totalPrice =
                    prices?.Total?.Price?.Total?.AmountWithTaxesFees ||
                    prices?.Total?.Price?.Total?.Amount ||
                    prices?.Total?.Price?.Amount ||
                    0;

                const dailyPrices = (prices?.Daily || []).map((day: any) => ({
                    date: day.Date,
                    amount: day.Price?.Total?.Amount || day.Price?.Amount || 0,
                    amountWithTax: day.Price?.Total?.AmountWithTaxesFees || 0,
                    tax: day.Price?.Tax?.Amount || 0,
                    fees: day.Price?.Fees?.Amount || 0,
                    currency: day.Price?.CurrencyCode,
                    inventory: day.AvailableInventory,
                }));

                const product: any = {
                    id: resv.id,
                    confirmationNumber: resv.confirmationNumber,
                    itineraryNumber: resv.itineraryNumber,
                    name: extras.displayname || "Room",
                    roomCode: stay.roomCode,
                    rateCode: stay.rateCode,
                    price: totalPrice,
                    actualTotal: actualTotal,
                    dailyRate: extras.amount || extras.amountWithTaxesFees,
                    currency: extras.currencyCode,
                    dailyPrices: dailyPrices,
                    taxes: prices?.Total?.Price?.Tax?.Amount || 0,
                    fees: prices?.Total?.Price?.Fees?.Amount || 0,
                    startDate: stay.startDate?.split("T")[0],
                    endDate: stay.endDate?.split("T")[0],
                    nights: dailyPrices.length || null,
                    adults: guests.numAdults || 1,
                    children: guests.numChildren || 0,
                    hotelId: String(resv.hotelId),
                    chainId: String(resv.chainId),
                    bedDescription: extras.bedDescription,
                    bedType: extras.bedType,
                    bedQuantity: extras.bedQuantity,
                    maxRoomSize: extras.maxRoomSize,
                    minRoomSize: extras.minRoomSize,
                    guestLimit: extras.guestLimit,
                    inventory: extras.inventory,
                    bookingPolicyCode: extras.bookingPolicyCode,
                    cancelPolicyCode: extras.cancelPolicyCode,
                    status: resv.status,
                    type: "room",
                    quantity: 1,
                    addons: resv.addOns || [],
                    image:
                        extras.coverImage ||
                        extras.imageUrls?.[0]?.Path ||
                        null,
                };

                products.push(product);
                total += totalPrice;
            }
        } catch (error) {
            console.error("SynXis: Error extracting cart API data:", error);
        }

        if (actualTotal !== null && actualTotal > 0) {
            total = actualTotal;
        } else if (total === 0) {
            total = this.totalAverage || 0;
        }

        return { products, total };
    }

    /**
     * Read the cart total as rendered on the SynXis checkout page.
     * Accounts for promo/discount adjustments applied client-side that
     * aren't reflected in the /gw/v1/cart/ API response.
     */
    private getSynxisActualTotal(): number | null {
        if (typeof document === "undefined") {
            return null;
        }

        const priceEl = document.querySelector(".price-summary_price span");
        if (!priceEl?.textContent) {
            return null;
        }

        return this.parseSynxisPrice(priceEl.textContent);
    }

    /**
     * Parse a locale-formatted price string like "12 980,50 kr" or "12,980.50 kr".
     * Handles both Norwegian (space/comma) and English (comma/dot) formats.
     */
    private parseSynxisPrice(text: string): number | null {
        const cleaned = text.replace(/[^\d,\.-]/g, "");
        if (!cleaned) {
            return null;
        }

        const lastDot = cleaned.lastIndexOf(".");
        const lastComma = cleaned.lastIndexOf(",");

        let normalized: string;
        if (lastDot === -1 && lastComma === -1) {
            normalized = cleaned;
        } else if (lastDot > lastComma) {
            normalized = cleaned.replace(/,/g, "");
        } else {
            normalized = cleaned.replace(/\./g, "").replace(",", ".");
        }

        const result = parseFloat(normalized);
        return isNaN(result) ? null : result;
    }

    /**
     * Get SynXis session identifiers from cookies and URL parameters
     */
    private getSynxisSessionIds(): {
        sbeSessionId: string | null;
        shoppingCartId: string | null;
        sbeRc: string | null;
        sbeRcDecoded: string | null;
    } | null {
        const sbeSessionId = this.getCookie("sbeSessionID");
        const shoppingCartId = this.getCookie("shoppingCartId");

        let sbeRc: string | null = null;
        let sbeRcDecoded: string | null = null;
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            sbeRc = params.get("sbe_rc");
            if (sbeRc) {
                try {
                    sbeRcDecoded = atob(sbeRc);
                } catch {
                    // Invalid base64
                }
            }
        }

        if (!sbeSessionId && !shoppingCartId && !sbeRc) {
            return null;
        }

        return { sbeSessionId, shoppingCartId, sbeRc, sbeRcDecoded };
    }

    /**
     * Get SynXis-related entries from window.dataLayer (fallback)
     */
    private getSynxisDataLayer(): any[] | null {
        if (typeof window === "undefined") {
            return null;
        }

        const dataLayer = (window as any).dataLayer;
        if (!Array.isArray(dataLayer)) {
            return null;
        }

        return dataLayer.filter((entry: any) => {
            return (
                entry.Cart ||
                entry.ecommerce?.checkout ||
                entry.ecommerce?.items ||
                entry.HName ||
                entry.HOTEL_ID ||
                entry.event === "checkout" ||
                entry.event === "checkoutLoad" ||
                entry.event === "app" ||
                entry.event === "purchase" ||
                entry.event === "confirmation" ||
                entry.event === "rooms.add" ||
                entry.TotalCost != null
            );
        });
    }

    /**
     * Extract products and total from SynXis dataLayer entries (fallback)
     */
    private extractSynxisProductsFromDataLayer(dataLayerEntries: any[]): {
        products: any[];
        total: number;
    } {
        const products: any[] = [];
        let total = 0;

        try {
            const main =
                dataLayerEntries.find((e) => e.event === "checkout") ||
                dataLayerEntries.find((e) => e.event === "purchase") ||
                dataLayerEntries.find((e) => e.event === "app" && e.Cart) ||
                dataLayerEntries.find((e) => e.Cart) ||
                dataLayerEntries.find((e) => e.event === "app") ||
                {};

            total =
                main.TotalCostWithTax ||
                main.TotalCost ||
                main.ItineraryPrice ||
                this.totalAverage ||
                0;

            const cart: any[] = main.Cart || [];
            if (cart.length > 0) {
                cart.forEach((item: any) => {
                    products.push({
                        id: item.RoomCode || item.HOTEL_ID,
                        name: item.RoomName || "Room",
                        price: item.TotalCostWithTax || item.TotalCost || 0,
                        quantity: 1,
                        type: "room",
                        startDate: item.ArrivalDt,
                        endDate: item.DepartDt,
                        roomCode: item.RoomCode,
                        rateCode: item.RateCode,
                        rateName: item.RateName,
                        hotelName: item.HName,
                        hotelId: item.HOTEL_ID,
                        chainName: item.ChainNm,
                        chainId: item.CHAIN_ID,
                        nights: item.NightsQty,
                        adults: item.AdultQty,
                        children: item.ChildQty,
                        dailyRate: item.DailyRateWithTax || item.DailyRate,
                        currency: item.CurrCode,
                        taxes: item.Taxes || 0,
                        status: item.DetailedResvStatus || item.ResvStatus,
                    });
                });
            } else if (main.RoomCode || main.RoomName) {
                products.push({
                    id: main.RoomCode || main.HOTEL_ID,
                    name: main.RoomName || "Room",
                    price: total,
                    quantity: 1,
                    type: "room",
                    startDate: main.ArrivalDt,
                    endDate: main.DepartDt,
                    roomCode: main.RoomCode,
                    rateCode: main.RateCode,
                    rateName: main.RateName,
                    hotelName: main.HName,
                    hotelId: main.HOTEL_ID,
                    nights: main.NightsQty,
                    adults: main.AdultQty,
                    children: main.ChildQty,
                    dailyRate: main.ItineraryDailyRate,
                    currency: main.CurrCode,
                    taxes: main.Taxes || 0,
                });
            }
        } catch (error) {
            console.error("SynXis: Error extracting dataLayer data:", error);
        }

        return { products, total };
    }

    /**
     * Read basket data from an Elina PMS booking page (e.g. /Confirm/SignUpOnBooking).
     * Elina exposes everything we need directly in the DOM — no API call required.
     * Returns null if cart elements aren't on the page, so totalAverage is used instead.
     */
    private async fetchElinapmsBasket(): Promise<{
        products: any[];
        total: number;
    } | null> {
        if (!this.campaign || this.campaign.type !== "elinapms") {
            return null;
        }
        if (typeof document === "undefined") {
            return null;
        }

        try {
            const cartItems = document.querySelectorAll(
                ".shoppingCartItem.align-centre",
            );
            if (cartItems.length === 0) {
                return null;
            }

            // Capture Elina's server-side cart key. The browser-scoped
            // bookingShoppingCart_0 GUID is the only stable handle on this
            // cart — sending it lets the backend correlate sessions and build
            // a "return to /Confirm/SignUpOnBooking" CTA later.
            const sessionIds = this.getElinapmsSessionIds();
            if (sessionIds) {
                (this as any)._elinapmsSessionIds = sessionIds;
            }

            const products = Array.from(cartItems).map((el) => {
                const cart = el as HTMLElement;
                return {
                    id: cart.dataset.id,
                    name: cart.dataset.tagname,
                    price: this.parseElinapmsNumber(cart.dataset.tagprice),
                    quantity: 1,
                    type: "accommodation",
                    category: cart.dataset.tagcategory,
                    locationId: cart.dataset.accid,
                    ratePlanId: cart.dataset.rateruleId,
                };
            });

            const total = this.extractElinapmsTotal();
            return { products, total };
        } catch (error) {
            console.error("Error extracting Elina PMS basket:", error);
            return null;
        }
    }

    /**
     * Resolve the booking total from the Elina PMS booking page.
     * Prefers the hidden #Total form input (the value posted on submit).
     * Falls back to summing accommodation base + fees + addons, mirroring the
     * Elina dataLayer script used for begin_checkout tracking.
     */
    private extractElinapmsTotal(): number {
        const totalInput = document.getElementById(
            "Total",
        ) as HTMLInputElement | null;
        if (totalInput && totalInput.value) {
            const t = this.parseElinapmsNumber(totalInput.value);
            if (t > 0) return t;
        }

        const accommodationTotal =
            document.getElementById("accommodationTotal");
        if (!accommodationTotal) {
            return this.totalAverage;
        }

        const baseEl = accommodationTotal.querySelector(".formattedCurrency");
        const baseVal = baseEl
            ? this.parseElinapmsNumber(baseEl.textContent)
            : 0;

        const feesEl =
            accommodationTotal.querySelector<HTMLElement>(".plusFees");
        const feeVal = feesEl
            ? this.parseElinapmsNumber(feesEl.dataset.att)
            : 0;

        let addonsVal = 0;
        const addonsDiv = document.getElementById("addonsTotal");
        if (addonsDiv) {
            const addonsEl = addonsDiv.querySelector(".formattedCurrency");
            addonsVal = addonsEl
                ? this.parseElinapmsNumber(addonsEl.textContent)
                : 0;
        }

        return baseVal + feeVal + addonsVal;
    }

    /**
     * Read Elina PMS / Norgesbooking session identifiers from cookies.
     * bookingShoppingCart_0 is a server-side cart GUID; the browser sending
     * this cookie to /Confirm/SignUpOnBooking re-renders the original cart.
     */
    private getElinapmsSessionIds(): {
        bookingShoppingCart: string | null;
    } | null {
        const cart = this.getCookie("bookingShoppingCart_0");
        if (!cart) return null;
        return { bookingShoppingCart: cart };
    }

    /**
     * Parse a number string from the Elina PMS DOM. Handles both European
     * ("2 840,00" or "2&nbsp;840,00") and US ("2,840.00") formats by detecting
     * which of `.` and `,` is the rightmost separator and treating that as the
     * decimal mark.
     */
    private parseElinapmsNumber(input: string | null | undefined): number {
        if (input === null || input === undefined) return 0;
        let s = String(input).replace(/[\s ]/g, "");
        if (!s) return 0;

        const lastComma = s.lastIndexOf(",");
        const lastDot = s.lastIndexOf(".");
        if (lastComma > lastDot) {
            s = s.replace(/\./g, "").replace(",", ".");
        } else if (lastDot > lastComma) {
            s = s.replace(/,/g, "");
        } else if (lastComma >= 0) {
            s = s.replace(",", ".");
        }

        const n = parseFloat(s);
        return isNaN(n) ? 0 : n;
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

    /**
     * Set up autofield listeners with retry logic
     * This ensures both InputDetector listeners and sessionStorage listeners are attached
     */
    private setupAutofieldListenersWithRetry(): void {
        let retries = 0;
        const maxRetries = 5;
        const retryInterval = 100;

        const trySetup = () => {
            const emailInput = document.querySelector<HTMLInputElement>(
                'input[name="emailAddress"]',
            );
            const phoneCountryCodeInput =
                document.querySelector<HTMLInputElement>(
                    'input[name="phoneCountryCode"]',
                );
            const phoneNumberInput = document.querySelector<HTMLInputElement>(
                'input[name="phoneNumber"]',
            );
            const firstNameInput = document.querySelector<HTMLInputElement>(
                'input[name="firstName"]',
            );
            const lastNameInput = document.querySelector<HTMLInputElement>(
                'input[name="lastName"]',
            );

            const allFound =
                emailInput ||
                phoneCountryCodeInput ||
                phoneNumberInput ||
                firstNameInput ||
                lastNameInput;

            if (allFound) {
                // Fields are found, set up all listeners
                this.addDirectAutofieldListeners();
                this.setupAutofieldStorageListeners();

                // Re-initialize input detector to pick up the new fields
                if (this.inputDetector) {
                    this.inputDetector.stopListening();
                    this.inputDetector.startListening();
                }
            } else if (retries < maxRetries) {
                // Fields not found yet, retry
                retries++;
                setTimeout(trySetup, retryInterval);
            } else {
                console.warn(
                    "Autofield inputs not found after retries, listeners may not be attached",
                );
            }
        };

        // Start trying immediately
        trySetup();
    }

    /**
     * Add direct listeners to autofields to ensure they're detected by InputDetector
     * This is necessary because InputDetector might use specific selectors that don't match autofields
     */
    private addDirectAutofieldListeners(): void {
        if (typeof document === "undefined" || !this.inputDetector) {
            return;
        }

        // Find all autofield inputs
        const autofieldInputs = [
            document.querySelector<HTMLInputElement>('input[name="firstName"]'),
            document.querySelector<HTMLInputElement>('input[name="lastName"]'),
            document.querySelector<HTMLInputElement>(
                'input[name="emailAddress"]',
            ),
            document.querySelector<HTMLInputElement>(
                'input[name="phoneCountryCode"]',
            ),
            document.querySelector<HTMLInputElement>(
                'input[name="phoneNumber"]',
            ),
        ].filter((input): input is HTMLInputElement => input !== null);

        // Add blur listeners that manually trigger the content update
        autofieldInputs.forEach((input) => {
            // Remove any existing listener to avoid duplicates
            const boundHandler = this.handleAutofieldBlur.bind(this);
            input.removeEventListener("blur", boundHandler);
            // Add the listener
            input.addEventListener("blur", boundHandler);
        });
    }

    /**
     * Handle blur event on autofield inputs
     * Manually triggers the content update callback to ensure autofields are detected
     */
    private handleAutofieldBlur(event: Event): void {
        if (!this.inputDetector) {
            return;
        }

        const input = event.target as HTMLInputElement;
        const value = input.value.trim();

        if (!value) {
            return;
        }

        // Get the current content from InputDetector
        const currentContent = this.inputDetector.getContent();

        // Determine field name based on input name and apply field mapping
        let fieldName = input.name;
        const inputMapping = (this.inputDetector as any).inputMapping;

        // Apply field mapping if available (same logic as InputDetector)
        if (inputMapping?.field_mappings?.[fieldName]) {
            fieldName = inputMapping.field_mappings[fieldName];
        } else {
            // Default mappings for autofields
            if (fieldName === "emailAddress") {
                fieldName = "email";
            } else if (fieldName === "phoneNumber") {
                fieldName = "phone_number";
            } else if (fieldName === "firstName") {
                fieldName = "first_name";
            } else if (fieldName === "lastName") {
                fieldName = "last_name";
            }
        }

        // Update content
        const updatedContent = { ...currentContent, [fieldName]: value };

        // Check if this is email or phone (using InputDetector's logic)
        const isEmail =
            fieldName === "email" ||
            fieldName.toLowerCase().includes("email") ||
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        const isPhone =
            fieldName === "phone_number" ||
            fieldName.toLowerCase().includes("phone") ||
            /^[\+]?[0-9\s\-\(\)]{7,}$/.test(value);

        // If we have email or phone, trigger the content update callback
        if (isEmail || isPhone || this.inputDetector.hasEmailOrPhoneNumber()) {
            // Get the session ID from InputDetector
            const sessionId = (this.inputDetector as any).sessionId;
            // Trigger the debounced content update callback directly
            this.debouncedHandleContentUpdate(updatedContent, sessionId);
        }
    }

    /**
     * Set up event listeners on autofield inputs to store values in sessionStorage
     */
    private setupAutofieldStorageListeners(): void {
        if (
            typeof document === "undefined" ||
            this.autofieldStorageListenersSetup
        ) {
            return;
        }

        // Email field
        const emailInput = document.querySelector<HTMLInputElement>(
            'input[name="emailAddress"]',
        );
        if (emailInput) {
            emailInput.addEventListener("input", (e) => {
                const target = e.target as HTMLInputElement;
                if (target.value) {
                    this.saveToSessionStorage("autofield_email", target.value);
                }
            });
            emailInput.addEventListener("blur", (e) => {
                const target = e.target as HTMLInputElement;
                if (target.value) {
                    this.saveToSessionStorage("autofield_email", target.value);
                }
            });
        }

        // Phone country code field
        const phoneCountryCodeInput = document.querySelector<HTMLInputElement>(
            'input[name="phoneCountryCode"]',
        );
        if (phoneCountryCodeInput) {
            phoneCountryCodeInput.addEventListener("input", (e) => {
                const target = e.target as HTMLInputElement;
                if (target.value) {
                    this.saveToSessionStorage(
                        "autofield_phoneCountryCode",
                        target.value,
                    );
                }
            });
            phoneCountryCodeInput.addEventListener("blur", (e) => {
                const target = e.target as HTMLInputElement;
                if (target.value) {
                    this.saveToSessionStorage(
                        "autofield_phoneCountryCode",
                        target.value,
                    );
                }
            });
        }

        // Phone number field
        const phoneNumberInput = document.querySelector<HTMLInputElement>(
            'input[name="phoneNumber"]',
        );
        if (phoneNumberInput) {
            phoneNumberInput.addEventListener("input", (e) => {
                const target = e.target as HTMLInputElement;
                if (target.value) {
                    this.saveToSessionStorage(
                        "autofield_phoneNumber",
                        target.value,
                    );
                }
            });
            phoneNumberInput.addEventListener("blur", (e) => {
                const target = e.target as HTMLInputElement;
                if (target.value) {
                    this.saveToSessionStorage(
                        "autofield_phoneNumber",
                        target.value,
                    );
                }
            });
        }

        // Mark as set up if at least one field was found
        if (emailInput || phoneCountryCodeInput || phoneNumberInput) {
            this.autofieldStorageListenersSetup = true;
        }
    }

    /**
     * Check if we're on the payment page and fill in fields from sessionStorage
     */
    private checkAndFillPaymentPageFields(): void {
        if (typeof window === "undefined") {
            return;
        }

        const currentPath = window.location.pathname;
        if (!currentPath.includes("payment/netseasy")) {
            return;
        }

        // Wait for the payment page fields to be available (including in iframes)
        this.fillPaymentPageFields();
    }

    /**
     * Fill in payment page fields from sessionStorage
     * Handles both main document and iframe scenarios
     */
    private fillPaymentPageFields(): void {
        if (typeof document === "undefined") {
            return;
        }

        // Use a retry mechanism since the fields might not be immediately available
        // Increased retries and interval for iframe scenarios
        let retries = 0;
        const maxRetries = 30; // Increased for iframe loading
        const retryInterval = 300; // ms - increased for iframe loading

        // Helper function to search for inputs in a document (main or iframe)
        const searchAndFillInDocument = (doc: Document): boolean => {
            let allFieldsFound = true;

            // Fill email field
            const email = this.getFromSessionStorage("autofield_email");
            if (email) {
                const emailInput = doc.getElementById(
                    "registrationManualEmail",
                ) as HTMLInputElement;
                if (emailInput && !emailInput.value) {
                    emailInput.value = email;
                    // Trigger input event to notify the form
                    emailInput.dispatchEvent(
                        new Event("input", { bubbles: true }),
                    );
                    emailInput.dispatchEvent(
                        new Event("change", { bubbles: true }),
                    );
                    console.log("Filled email from sessionStorage:", email);
                } else if (!emailInput) {
                    allFieldsFound = false;
                }
            }

            // Fill phone number fields
            const phoneCountryCode = this.getFromSessionStorage(
                "autofield_phoneCountryCode",
            );
            const phoneNumber = this.getFromSessionStorage(
                "autofield_phoneNumber",
            );

            if (phoneCountryCode || phoneNumber) {
                // Find the country code hidden input
                const countryCodeInput = doc.querySelector<HTMLInputElement>(
                    'input[name="country-code"]',
                );
                if (countryCodeInput && phoneCountryCode) {
                    // Set the hidden input value
                    countryCodeInput.value = phoneCountryCode;
                    // Try to update the react-select component
                    countryCodeInput.dispatchEvent(
                        new Event("change", { bubbles: true }),
                    );

                    // Also try to find and update the react-select input field
                    const reactSelectInput =
                        doc.querySelector<HTMLInputElement>(
                            '#registrationManualPhonePrefix input[type="text"]',
                        );
                    if (reactSelectInput) {
                        reactSelectInput.value = phoneCountryCode;
                        reactSelectInput.dispatchEvent(
                            new Event("input", { bubbles: true }),
                        );
                        reactSelectInput.dispatchEvent(
                            new Event("change", { bubbles: true }),
                        );
                    }

                    // Try to find the react-select container and update display
                    const reactSelectContainer = doc.getElementById(
                        "registrationManualPhonePrefix",
                    );
                    if (reactSelectContainer) {
                        // Try to find the value display element and update it
                        const valueDisplay = reactSelectContainer.querySelector(
                            ".css-1yh68ch-singleValue",
                        );
                        if (valueDisplay) {
                            valueDisplay.textContent = phoneCountryCode;
                        }
                    }

                    console.log(
                        "Filled phone country code from sessionStorage:",
                        phoneCountryCode,
                    );
                } else if (phoneCountryCode && !countryCodeInput) {
                    allFieldsFound = false;
                }

                // Fill the phone number field
                const phoneNumberInput = doc.getElementById(
                    "registrationManualPhoneNumber",
                ) as HTMLInputElement;
                if (
                    phoneNumberInput &&
                    phoneNumber &&
                    !phoneNumberInput.value
                ) {
                    phoneNumberInput.value = phoneNumber;
                    // Trigger input event to notify the form
                    phoneNumberInput.dispatchEvent(
                        new Event("input", { bubbles: true }),
                    );
                    phoneNumberInput.dispatchEvent(
                        new Event("change", { bubbles: true }),
                    );
                    console.log(
                        "Filled phone number from sessionStorage:",
                        phoneNumber,
                    );
                } else if (phoneNumber && !phoneNumberInput) {
                    allFieldsFound = false;
                }
            }

            return allFieldsFound;
        };

        const tryFillFields = () => {
            let allFieldsFound = true;

            // First, try to fill in the main document
            const mainDocFound = searchAndFillInDocument(document);
            if (!mainDocFound) {
                allFieldsFound = false;
            }

            // Also check all iframes in the document
            const iframes = document.querySelectorAll("iframe");
            let iframeFound = false;

            iframes.forEach((iframe) => {
                try {
                    // Try to access iframe content (may fail due to cross-origin restrictions)
                    const iframeDoc =
                        iframe.contentDocument ||
                        iframe.contentWindow?.document;
                    if (iframeDoc) {
                        const iframeDocFound =
                            searchAndFillInDocument(iframeDoc);
                        if (iframeDocFound) {
                            iframeFound = true;
                        } else {
                            allFieldsFound = false;
                        }
                    }
                } catch (error) {
                    // Cross-origin iframe - cannot access directly
                    // Try using postMessage as a workaround (requires iframe to listen for messages)
                    this.tryPostMessageToIframe(iframe);
                }
            });

            // If fields were found in either main doc or iframe, we're done
            if (mainDocFound || iframeFound) {
                allFieldsFound = true;
            }

            // If not all fields were found and we haven't exceeded retries, try again
            if (!allFieldsFound && retries < maxRetries) {
                retries++;
                setTimeout(tryFillFields, retryInterval);
            } else if (retries >= maxRetries && !allFieldsFound) {
                console.warn(
                    "Payment page fields not found after maximum retries. Fields may be in a cross-origin iframe or not yet loaded.",
                );
            }
        };

        // Start trying to fill fields
        tryFillFields();

        // Also set up MutationObserver to watch for dynamically added iframes
        this.setupIframeWatcher();
    }

    /**
     * Try to send data to cross-origin iframe using postMessage
     * Attempts multiple message formats in case the iframe uses different conventions
     */
    private tryPostMessageToIframe(iframe: HTMLIFrameElement): void {
        try {
            const email = this.getFromSessionStorage("autofield_email");
            const phoneCountryCode = this.getFromSessionStorage(
                "autofield_phoneCountryCode",
            );
            const phoneNumber = this.getFromSessionStorage(
                "autofield_phoneNumber",
            );

            // Only send if we have data to send
            if (!email && !phoneCountryCode && !phoneNumber) {
                return;
            }

            // Get iframe's origin for security
            let targetOrigin = "*";
            if (iframe.src) {
                try {
                    targetOrigin = new URL(iframe.src).origin;
                } catch (e) {
                    // If src is not a valid URL, use *
                }
            }

            // Check if this is a payment provider iframe
            const isDibsIframe =
                iframe.src?.includes("dibspayment.eu") ||
                iframe.src?.includes("dibs.") ||
                iframe.name?.toLowerCase().includes("dibs");

            const isNetsEasyIframe =
                iframe.src?.includes("netseasy") ||
                iframe.src?.includes("nets.eu") ||
                iframe.src?.includes("nexigroup.com") ||
                iframe.src?.includes("dibspayment.eu") || // Dibs is part of Nexi Group
                iframe.name?.toLowerCase().includes("nets") ||
                iframe.name?.toLowerCase().includes("easy");

            if (!iframe.contentWindow) {
                return;
            }

            // Try multiple message formats
            const messages = [
                // Format 1: Our standard format
                {
                    type: "ekteintelligens-autofill",
                    email: email || null,
                    phoneCountryCode: phoneCountryCode || null,
                    phoneNumber: phoneNumber || null,
                },
                // Format 2: Dibs/Nets Easy-specific formats
                ...(isDibsIframe || isNetsEasyIframe
                    ? [
                          {
                              type: "dibs-autofill",
                              email: email || null,
                              phoneCountryCode: phoneCountryCode || null,
                              phoneNumber: phoneNumber || null,
                          },
                          {
                              type: "nets-easy-autofill",
                              email: email || null,
                              phoneCountryCode: phoneCountryCode || null,
                              phoneNumber: phoneNumber || null,
                          },
                          {
                              action: "autofill",
                              data: {
                                  email: email || null,
                                  phoneCountryCode: phoneCountryCode || null,
                                  phoneNumber: phoneNumber || null,
                              },
                          },
                          {
                              event: "customer-data",
                              customer: {
                                  email: email || null,
                                  phone: phoneNumber
                                      ? `${phoneCountryCode || ""}${phoneNumber}`
                                      : null,
                                  phoneCountryCode: phoneCountryCode || null,
                              },
                          },
                      ]
                    : []),
                // Format 3: Generic autofill format
                {
                    action: "autofill-fields",
                    email: email || null,
                    phoneCountryCode: phoneCountryCode || null,
                    phoneNumber: phoneNumber || null,
                },
            ];

            // Send all message formats
            messages.forEach((message) => {
                try {
                    iframe.contentWindow!.postMessage(message, targetOrigin);
                } catch (e) {
                    // Ignore errors for individual messages
                }
            });

            const providerName = isNetsEasyIframe
                ? "Nets Easy/Nexi"
                : isDibsIframe
                  ? "Dibs"
                  : "cross-origin";
            console.log(
                `Sent autofill data to ${providerName} iframe via postMessage (${messages.length} formats):`,
                {
                    iframeSrc: iframe.src?.substring(0, 100) || "unknown",
                    email: email ? "***" : null,
                    phoneCountryCode,
                    phoneNumber: phoneNumber ? "***" : null,
                    targetOrigin,
                },
            );

            // Also check if we can modify the iframe src with URL parameters
            this.tryIframeUrlParameters(
                iframe,
                email,
                phoneCountryCode,
                phoneNumber,
            );
        } catch (error) {
            console.warn("Failed to send postMessage to iframe:", error);
        }
    }

    /**
     * Try to pass data via URL parameters if the iframe src can be modified
     * This only works if the iframe hasn't loaded yet or can be reloaded
     */
    private tryIframeUrlParameters(
        iframe: HTMLIFrameElement,
        email: string | null,
        phoneCountryCode: string | null,
        phoneNumber: string | null,
    ): void {
        if (!iframe.src) {
            return;
        }

        try {
            const url = new URL(iframe.src);
            const isDibs =
                url.hostname.includes("dibspayment.eu") ||
                url.hostname.includes("dibs.");
            const isNetsEasy =
                url.hostname.includes("netseasy") ||
                url.hostname.includes("nets.eu") ||
                url.hostname.includes("nexigroup.com") ||
                url.hostname.includes("dibspayment.eu"); // Dibs is part of Nexi Group

            if (!isDibs && !isNetsEasy) {
                return;
            }

            // Check if URL already has parameters (might indicate it supports them)
            const hasParams = url.searchParams.toString().length > 0;

            // Log potential parameters for debugging
            if (email || phoneCountryCode || phoneNumber) {
                const providerName = isNetsEasy
                    ? "Nets Easy/Nexi"
                    : isDibs
                      ? "Dibs"
                      : "Payment";
                console.log(`${providerName} iframe URL analysis:`, {
                    currentUrl: iframe.src,
                    hasParams,
                    suggestedParams: {
                        ...(email ? { email } : {}),
                        ...(phoneCountryCode ? { phoneCountryCode } : {}),
                        ...(phoneNumber ? { phoneNumber: "***" } : {}),
                    },
                    note: hasParams
                        ? "Iframe URL has parameters - might support additional ones"
                        : `Iframe URL has no parameters - check ${isNetsEasy ? "Nets Easy/Nexi" : "Dibs"} documentation for supported params`,
                    provider: isNetsEasy ? "Nets Easy/Nexi Group" : "Dibs",
                });
            }
        } catch (error) {
            // URL parsing failed, ignore
        }
    }

    /**
     * Set up a MutationObserver to watch for dynamically added iframes
     */
    private setupIframeWatcher(): void {
        if (typeof document === "undefined") {
            return;
        }

        // Don't set up multiple observers
        if ((this as any)._iframeObserver) {
            return;
        }

        // Watch for new iframes being added to the DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as HTMLElement;

                        // Check if the added node is an iframe
                        if (element.tagName === "IFRAME") {
                            const iframe = element as HTMLIFrameElement;
                            // Wait for iframe to load, then try to fill fields
                            iframe.addEventListener("load", () => {
                                setTimeout(() => {
                                    this.fillPaymentPageFields();
                                }, 500); // Give iframe content time to render
                            });
                        }

                        // Also check for iframes nested inside the added node
                        const nestedIframes =
                            element.querySelectorAll("iframe");
                        nestedIframes.forEach((iframe) => {
                            iframe.addEventListener("load", () => {
                                setTimeout(() => {
                                    this.fillPaymentPageFields();
                                }, 500);
                            });
                        });
                    }
                });
            });
        });

        // Start observing (wait for body if not ready)
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        } else {
            // Wait for DOM to be ready
            document.addEventListener("DOMContentLoaded", () => {
                if (document.body) {
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                    });
                }
            });
        }

        // Store observer so we can disconnect it later if needed
        (this as any)._iframeObserver = observer;
    }

    /**
     * Save value to sessionStorage
     */
    private saveToSessionStorage(key: string, value: string): void {
        if (typeof window !== "undefined" && window.sessionStorage) {
            try {
                sessionStorage.setItem(key, value);
                console.log(`Saved to sessionStorage: ${key} = ${value}`);
            } catch (error) {
                console.warn(
                    `Failed to save to sessionStorage (${key}):`,
                    error,
                );
            }
        }
    }

    /**
     * Get value from sessionStorage
     */
    private getFromSessionStorage(key: string): string | null {
        if (typeof window !== "undefined" && window.sessionStorage) {
            try {
                return sessionStorage.getItem(key);
            } catch (error) {
                console.warn(
                    `Failed to get from sessionStorage (${key}):`,
                    error,
                );
                return null;
            }
        }
        return null;
    }

    /**
     * Set up listener for URL changes (for SPA navigation)
     */
    private setupUrlChangeListener(): void {
        if (typeof window === "undefined") {
            return;
        }

        // Check on initial load
        this.checkAndFillPaymentPageFields();

        // Listen for popstate events (back/forward navigation)
        window.addEventListener("popstate", () => {
            setTimeout(() => {
                this.checkAndFillPaymentPageFields();
            }, 100);
        });

        // Use MutationObserver to detect URL changes in SPAs
        // This watches for changes to the history API
        let lastUrl = window.location.href;
        const urlCheckInterval = setInterval(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                this.checkAndFillPaymentPageFields();
            }
        }, 500);

        // Store interval ID so we can clear it on destroy
        (this as any)._urlCheckInterval = urlCheckInterval;
    }
}
