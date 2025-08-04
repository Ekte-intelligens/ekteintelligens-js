import { InputDetector } from "../utils/input-detector";
import { ProductDetector } from "../utils/product-detector";
import { TotalExtractor } from "../utils/total-extractor";
import { SupabaseService } from "../services/supabase-service";
import { SDKOptions, CartSessionPayload } from "../types";

export class AbandonedCartTool {
    private options: SDKOptions;
    private supabaseService: SupabaseService;
    private inputDetector?: InputDetector;
    private productDetector?: ProductDetector;
    private totalExtractor?: TotalExtractor;
    private _sessionId?: string;
    private isInitialized = false;
    private previousContent: Record<string, any> = {};
    private previousProducts: any[] = [];
    private previousTotal: number = 0;

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
            // Fetch campaign data from Supabase
            const campaign = await this.supabaseService.getCheckoutCampaign(
                this.options.checkoutCampaignId
            );

            if (!campaign) {
                console.error("Failed to fetch checkout campaign data");
                return false;
            }

            // Initialize input detector with the campaign's input mapping
            this.inputDetector = new InputDetector(campaign.input_mapping);

            // Initialize product detector with the campaign's product mapping
            this.productDetector = new ProductDetector(
                campaign.product_mapping
            );

            // Initialize total extractor with the campaign's total selector
            this.totalExtractor = new TotalExtractor(campaign.total_selector);

            // Set up the content update callback
            this.inputDetector.setOnContentUpdate(
                this.handleContentUpdate.bind(this)
            );

            // Start listening to input events
            this.inputDetector.startListening();

            this.isInitialized = true;
            console.log("Abandoned cart tool initialized successfully");
            return true;
        } catch (error) {
            console.error("Failed to initialize abandoned cart tool:", error);
            return false;
        }
    }

    private async handleContentUpdate(
        content: Record<string, any>,
        sessionId?: string
    ) {
        try {
            // Detect products on the page
            const products = this.productDetector?.detectProducts() || [];

            // Extract cart total
            const total = this.totalExtractor?.extractTotal() || 0;

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

            // Get current page URL with query parameters
            const currentUrl =
                typeof window !== "undefined" ? window.location.href : "";

            const payload: CartSessionPayload = {
                organization_id: this.options.organizationId,
                checkout_campaign_id: this.options.checkoutCampaignId,
                content: content,
                products: products,
                url: currentUrl,
                total: total,
                id: sessionId,
            };

            const response = await this.supabaseService.submitCartSession(
                payload
            );

            if (response && response.id) {
                // Store the session ID for future updates
                this._sessionId = response.id;
                this.inputDetector?.setSessionId(response.id);

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
        if (this.inputDetector) {
            this.inputDetector.stopListening();
        }
        this.isInitialized = false;
        this._sessionId = undefined;
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
}
