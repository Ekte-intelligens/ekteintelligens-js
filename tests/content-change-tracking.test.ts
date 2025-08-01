import { AbandonedCartTool } from "../src/tools/abandoned-cart";
import { SDKOptions } from "../src/types";

// Mock SupabaseService
jest.mock("../src/services/supabase-service");
const mockSupabaseService = {
    getCheckoutCampaign: jest.fn(),
    submitCartSession: jest.fn(),
};

// Mock the SupabaseService constructor
jest.mock("../src/services/supabase-service", () => ({
    SupabaseService: jest.fn().mockImplementation(() => mockSupabaseService),
}));

// Mock the utility classes
jest.mock("../src/utils/input-detector");
jest.mock("../src/utils/product-detector");
jest.mock("../src/utils/total-extractor");

const mockInputDetector = {
    setOnContentUpdate: jest.fn(),
    startListening: jest.fn(),
    stopListening: jest.fn(),
    setSessionId: jest.fn(),
    getContent: jest.fn(),
    hasEmailOrPhoneNumber: jest.fn(),
};

const mockProductDetector = {
    detectProducts: jest.fn(),
};

const mockTotalExtractor = {
    extractTotal: jest.fn(),
};

jest.mock("../src/utils/input-detector", () => ({
    InputDetector: jest.fn().mockImplementation(() => mockInputDetector),
}));

jest.mock("../src/utils/product-detector", () => ({
    ProductDetector: jest.fn().mockImplementation(() => mockProductDetector),
}));

jest.mock("../src/utils/total-extractor", () => ({
    TotalExtractor: jest.fn().mockImplementation(() => mockTotalExtractor),
}));

describe("Content Change Tracking", () => {
    let abandonedCartTool: AbandonedCartTool;
    let mockContentUpdateCallback: (
        content: Record<string, any>,
        sessionId?: string
    ) => void;

    const mockCampaign = {
        input_mapping: null,
        product_mapping: {},
        total_selector: "#cart-total",
    };

    const mockSDKOptions: SDKOptions = {
        organizationId: "test-org",
        checkoutCampaignId: "test-campaign",
        features: {
            abandonedCart: true,
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks
        mockSupabaseService.getCheckoutCampaign.mockResolvedValue(mockCampaign);
        mockSupabaseService.submitCartSession.mockResolvedValue({
            success: true,
            id: "test-session-id",
        });

        mockInputDetector.setOnContentUpdate.mockImplementation((callback) => {
            mockContentUpdateCallback = callback;
        });

        mockProductDetector.detectProducts.mockReturnValue([]);
        mockTotalExtractor.extractTotal.mockReturnValue(0);

        abandonedCartTool = new AbandonedCartTool(mockSDKOptions);
    });

    it("should upload when content changes for the first time", async () => {
        await abandonedCartTool.initialize();

        const testContent = { email: "test@example.com" };

        // Trigger content update
        mockContentUpdateCallback(testContent);

        expect(mockSupabaseService.submitCartSession).toHaveBeenCalledTimes(1);
        expect(mockSupabaseService.submitCartSession).toHaveBeenCalledWith(
            expect.objectContaining({
                content: testContent,
            })
        );
    });

    it("should not upload when content has not changed", async () => {
        await abandonedCartTool.initialize();

        const testContent = { email: "test@example.com" };

        // First update - should upload
        mockContentUpdateCallback(testContent);
        expect(mockSupabaseService.submitCartSession).toHaveBeenCalledTimes(1);

        // Reset the mock to clear the call count
        mockSupabaseService.submitCartSession.mockClear();

        // Second update with same content - should not upload
        mockContentUpdateCallback(testContent);
        expect(mockSupabaseService.submitCartSession).toHaveBeenCalledTimes(0);
    });

    it("should upload when content changes", async () => {
        await abandonedCartTool.initialize();

        const initialContent = { email: "test@example.com" };
        const updatedContent = { email: "updated@example.com" };

        // First update
        mockContentUpdateCallback(initialContent);
        expect(mockSupabaseService.submitCartSession).toHaveBeenCalledTimes(1);

        // Reset the mock to clear the call count
        mockSupabaseService.submitCartSession.mockClear();

        // Second update with different content
        mockContentUpdateCallback(updatedContent);
        expect(mockSupabaseService.submitCartSession).toHaveBeenCalledTimes(1);
    });

    it("should upload when products change", async () => {
        await abandonedCartTool.initialize();

        const testContent = { email: "test@example.com" };

        // First update with no products
        mockProductDetector.detectProducts.mockReturnValue([]);
        mockContentUpdateCallback(testContent);
        expect(mockSupabaseService.submitCartSession).toHaveBeenCalledTimes(1);

        // Reset the mock to clear the call count
        mockSupabaseService.submitCartSession.mockClear();

        // Second update with products
        mockProductDetector.detectProducts.mockReturnValue([
            { id: "1", name: "Product 1", price: 10 },
        ]);
        mockContentUpdateCallback(testContent);
        expect(mockSupabaseService.submitCartSession).toHaveBeenCalledTimes(1);
    });

    it("should upload when total changes", async () => {
        await abandonedCartTool.initialize();

        const testContent = { email: "test@example.com" };

        // First update with total 0
        mockTotalExtractor.extractTotal.mockReturnValue(0);
        mockContentUpdateCallback(testContent);
        expect(mockSupabaseService.submitCartSession).toHaveBeenCalledTimes(1);

        // Reset the mock to clear the call count
        mockSupabaseService.submitCartSession.mockClear();

        // Second update with total 100
        mockTotalExtractor.extractTotal.mockReturnValue(100);
        mockContentUpdateCallback(testContent);
        expect(mockSupabaseService.submitCartSession).toHaveBeenCalledTimes(1);
    });

    it("should reset change tracking when resetChangeTracking is called", async () => {
        await abandonedCartTool.initialize();

        const testContent = { email: "test@example.com" };

        // First update
        mockContentUpdateCallback(testContent);
        expect(mockSupabaseService.submitCartSession).toHaveBeenCalledTimes(1);

        // Reset the mock to clear the call count
        mockSupabaseService.submitCartSession.mockClear();

        // Second update with same content - should not upload
        mockContentUpdateCallback(testContent);
        expect(mockSupabaseService.submitCartSession).toHaveBeenCalledTimes(0);

        // Reset change tracking
        abandonedCartTool.resetChangeTracking();

        // Third update with same content - should upload because tracking was reset
        mockContentUpdateCallback(testContent);
        expect(mockSupabaseService.submitCartSession).toHaveBeenCalledTimes(1);
    });
});
