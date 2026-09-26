import { AbandonedCartTool } from "../src/tools/abandoned-cart";
import { SDKOptions } from "../src/types";

jest.mock("../src/services/supabase-service", () => ({
    SupabaseService: jest.fn().mockImplementation(() => ({
        getCheckoutCampaign: jest.fn().mockResolvedValue(null),
        submitCartSession: jest.fn().mockResolvedValue({ success: true }),
    })),
}));

describe("BookVisit autofields injection", () => {
    const options: SDKOptions = {
        organizationId: "test-org-id",
        checkoutCampaignId: "test-campaign-id",
        features: { abandonedCart: true },
    };

    const SECTION = '[data-testid="checkout_responsible_for_booking_section"]';

    const inject = () => {
        const tool = new AbandonedCartTool(options);
        (tool as any).injectBookVisitAutofields(null);
    };

    it("injects all fields when none exist on the page", () => {
        document.body.innerHTML = `<div id="main_content_container"></div>`;

        inject();

        expect(document.querySelectorAll(SECTION)).toHaveLength(1);
        expect(document.querySelectorAll("#customer-firstName")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-lastName")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-emailAddress")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-phoneNumber")).toHaveLength(1);
    });

    it("does not inject anything when BookVisit already renders the fields", () => {
        document.body.innerHTML = `
            <div id="main_content_container">
                <div data-testid="checkout_responsible_for_booking_section">
                    <input id="customer-firstName" name="firstName">
                    <input id="customer-lastName" name="lastName">
                    <input id="customer-emailAddress" name="emailAddress">
                    <input id="customer-phoneCountryCode" name="phoneCountryCode">
                    <input id="customer-phoneNumber" name="phoneNumber">
                </div>
            </div>`;

        inject();

        expect(document.querySelectorAll(SECTION)).toHaveLength(1);
        expect(document.querySelectorAll("#customer-firstName")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-lastName")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-emailAddress")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-phoneNumber")).toHaveLength(1);
        expect(document.querySelectorAll('[data-testid="customer_info_section"]')).toHaveLength(0);
    });

    it("injects only the fields that are missing", () => {
        document.body.innerHTML = `
            <div id="main_content_container">
                <input name="emailAddress">
                <input name="phoneNumber">
            </div>`;

        inject();

        expect(document.querySelectorAll('input[name="emailAddress"]')).toHaveLength(1);
        expect(document.querySelectorAll('input[name="phoneNumber"]')).toHaveLength(1);
        expect(document.querySelectorAll("#customer-firstName")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-lastName")).toHaveLength(1);
    });
});
