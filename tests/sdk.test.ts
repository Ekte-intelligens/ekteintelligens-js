import { EkteIntelligensSDK } from "../src/sdk";

jest.mock("../src/services/supabase-service", () => {
    return {
        SupabaseService: jest.fn().mockImplementation(() => ({
            getCheckoutCampaign: jest.fn().mockResolvedValue({
                id: "test-campaign-id",
                product_mapping: {},
                input_mapping: null,
            }),
            submitCartSession: jest.fn().mockResolvedValue({
                id: "test-session-id",
                success: true,
            }),
        })),
    };
});

describe("EkteIntelligensSDK", () => {
    const options = {
        organizationId: "test-org-id",
        cartCampaignId: "test-campaign-id",
        // Using default backend credentials
        features: {
            abandonedCart: true,
        },
    };

    it("should initialize successfully", async () => {
        const sdk = new EkteIntelligensSDK(options);
        const result = await sdk.initialize();
        expect(result).toBe(true);
        expect(sdk.isInitialized()).toBe(true);
    });

    it("should return abandoned cart tool when enabled", async () => {
        const sdk = new EkteIntelligensSDK(options);
        await sdk.initialize();
        const tool = sdk.getAbandonedCartTool();
        expect(tool).toBeDefined();
    });

    it("should not return abandoned cart tool when disabled", async () => {
        const sdk = new EkteIntelligensSDK({
            ...options,
            features: { abandonedCart: false },
        });
        await sdk.initialize();
        const tool = sdk.getAbandonedCartTool();
        expect(tool).toBeUndefined();
    });
});
