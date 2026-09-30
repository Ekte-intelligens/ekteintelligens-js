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

    // Let MutationObserver callbacks run
    const flushObservers = () => Promise.resolve();

    const isShown = (field: string) =>
        (document.querySelector(`[data-ei-autofield="${field}"]`) as HTMLElement)
            .style.display !== "none";

    const NATIVE_FIELDS = `
        <div data-testid="checkout_responsible_for_booking_section">
            <input id="customer-firstName" name="firstName">
            <input id="customer-lastName" name="lastName">
            <input id="customer-emailAddress" name="emailAddress">
            <input id="customer-phoneCountryCode" name="phoneCountryCode">
            <input id="customer-phoneNumber" name="phoneNumber">
        </div>`;

    beforeEach(() => {
        jest.useFakeTimers();
        sessionStorage.clear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("injects all fields when none exist on the page", () => {
        document.body.innerHTML = `<div id="main_content_container"></div>`;

        inject();
        jest.advanceTimersByTime(1000);

        expect(document.querySelectorAll(SECTION)).toHaveLength(1);
        expect(document.querySelectorAll("#customer-firstName")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-lastName")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-emailAddress")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-phoneNumber")).toHaveLength(1);
    });

    it("hides our fields and removes them after settling when BookVisit keeps rendering its own", () => {
        document.body.innerHTML = `<div id="main_content_container">${NATIVE_FIELDS}</div>`;

        inject();

        // Injected up front, but hidden since BookVisit's own are on the page
        const ours = document.querySelector("[data-ei-autofields]") as HTMLElement;
        expect(ours).not.toBeNull();
        expect(ours.style.display).toBe("none");

        jest.advanceTimersByTime(1000);

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
        expect(isShown("firstName")).toBe(true);
        expect(isShown("email")).toBe(false);
        jest.advanceTimersByTime(1000);

        expect(document.querySelectorAll('input[name="emailAddress"]')).toHaveLength(1);
        expect(document.querySelectorAll('input[name="phoneNumber"]')).toHaveLength(1);
        expect(document.querySelectorAll("#customer-firstName")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-lastName")).toHaveLength(1);
    });

    it("keeps our fields when BookVisit only renders its own for a split second", async () => {
        document.body.innerHTML = `<div id="main_content_container">${NATIVE_FIELDS}</div>`;

        inject();
        expect(isShown("email")).toBe(false);

        // BookVisit removes its fields again shortly after rendering them
        document
            .querySelector('[data-testid="checkout_responsible_for_booking_section"]:not([data-ei-autofields])')!
            .remove();
        await flushObservers();

        expect(isShown("firstName")).toBe(true);
        expect(isShown("email")).toBe(true);
        expect((document.querySelector("[data-ei-autofields]") as HTMLElement).style.display).toBe("");

        jest.advanceTimersByTime(1000);

        expect(document.querySelectorAll(SECTION)).toHaveLength(1);
        expect(document.querySelectorAll("#customer-firstName")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-lastName")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-emailAddress")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-phoneNumber")).toHaveLength(1);
    });

    it("attaches storage listeners to our fields when BookVisit's flash fields come first on the page", async () => {
        document.body.innerHTML = `${NATIVE_FIELDS}<div id="main_content_container"></div>`;

        inject();
        document.querySelector('[data-testid="checkout_responsible_for_booking_section"]:not([data-ei-autofields])')!.remove();
        await flushObservers();
        jest.advanceTimersByTime(1000);

        const email = document.querySelector<HTMLInputElement>('input[name="emailAddress"]')!;
        email.value = "test@example.com";
        email.dispatchEvent(new Event("input"));

        expect(sessionStorage.getItem("autofield_email")).toBe("test@example.com");
    });

    it("does not touch the page after destroy", () => {
        document.body.innerHTML = `<div id="main_content_container">${NATIVE_FIELDS}</div>`;

        const tool = new AbandonedCartTool(options);
        (tool as any).injectBookVisitAutofields(null);
        tool.destroy();
        jest.advanceTimersByTime(1000);

        // The settle check never ran, so our hidden section is still there
        expect(document.querySelectorAll("[data-ei-autofields]")).toHaveLength(1);
    });
});
