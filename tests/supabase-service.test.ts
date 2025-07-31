import { SupabaseService } from "../src/services/supabase-service";

jest.mock("@supabase/supabase-js", () => {
    return {
        createClient: jest.fn(() => ({
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
                data: {
                    id: "test-campaign-id",
                    product_mapping: {},
                    input_mapping: null,
                },
                error: null,
            }),
            functions: {
                invoke: jest.fn().mockResolvedValue({
                    data: { id: "test-session-id", success: true },
                    error: null,
                }),
            },
        })),
    };
});

describe("SupabaseService", () => {
    const supabaseUrl = "https://test.supabase.co";
    const supabaseAnonKey = "test-key";

    it("should fetch checkout campaign", async () => {
        const service = new SupabaseService(supabaseUrl, supabaseAnonKey);
        const campaign = await service.getCheckoutCampaign("test-campaign-id");
        expect(campaign).toBeDefined();
        expect(campaign?.id).toBe("test-campaign-id");
    });

    it("should submit cart session", async () => {
        const service = new SupabaseService(supabaseUrl, supabaseAnonKey);
        const response = await service.submitCartSession({
            organization_id: "org",
            cart_campaign_id: "camp",
            content: {},
        });
        expect(response).toBeDefined();
        expect(response?.id).toBe("test-session-id");
        expect(response?.success).toBe(true);
    });
});
