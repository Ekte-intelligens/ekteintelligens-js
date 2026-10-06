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
    const NATIVE_SECTION = `${SECTION}:not([data-ei-autofields])`;

    const NATIVE_FIELDS = `
        <div data-testid="checkout_responsible_for_booking_section">
            <input id="customer-firstName" name="firstName">
            <input id="customer-lastName" name="lastName">
            <input id="customer-emailAddress" name="emailAddress">
            <input id="customer-phoneCountryCode" name="phoneCountryCode">
            <input id="customer-phoneNumber" name="phoneNumber">
        </div>`;

    let tool: AbandonedCartTool;

    const inject = () => {
        tool = new AbandonedCartTool(options);
        (tool as any).injectBookVisitAutofields(null);
    };

    // Let MutationObserver callbacks run, including ones our own changes cause
    const flushObservers = async () => {
        for (let i = 0; i < 3; i++) await Promise.resolve();
    };

    const ours = () => document.querySelectorAll("[data-ei-autofields]");

    const expectEachFieldOnce = () => {
        expect(document.querySelectorAll("#customer-firstName")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-lastName")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-emailAddress")).toHaveLength(1);
        expect(document.querySelectorAll("#customer-phoneNumber")).toHaveLength(1);
    };

    beforeEach(() => {
        window.history.replaceState({}, "", "/checkout");
        sessionStorage.clear();
    });

    afterEach(() => {
        tool?.destroy();
    });

    it("injects all fields when none exist on the page", () => {
        document.body.innerHTML = `<div id="main_content_container"></div>`;

        inject();

        expect(document.querySelectorAll(SECTION)).toHaveLength(1);
        expect(ours()).toHaveLength(1);
        expectEachFieldOnce();
    });

    it("does not inject anything while BookVisit renders the fields itself", () => {
        document.body.innerHTML = `<div id="main_content_container">${NATIVE_FIELDS}</div>`;

        inject();

        expect(document.querySelectorAll(SECTION)).toHaveLength(1);
        expect(ours()).toHaveLength(0);
        expectEachFieldOnce();
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

    it("adds our fields whenever BookVisit removes its own, however late", async () => {
        jest.useFakeTimers();
        try {
            document.body.innerHTML = `<div id="main_content_container">${NATIVE_FIELDS}</div>`;

            inject();
            expect(ours()).toHaveLength(0);

            // Slow devices can keep BookVisit's fields around for seconds
            jest.advanceTimersByTime(5000);
            document.querySelector(NATIVE_SECTION)!.remove();
            await flushObservers();

            expect(ours()).toHaveLength(1);
            expectEachFieldOnce();
        } finally {
            jest.useRealTimers();
        }
    });

    it("takes our fields off the page when BookVisit renders its own later", async () => {
        document.body.innerHTML = `<div id="main_content_container"></div>`;

        inject();
        expect(ours()).toHaveLength(1);

        document
            .getElementById("main_content_container")!
            .insertAdjacentHTML("beforeend", NATIVE_FIELDS);
        await flushObservers();

        expect(ours()).toHaveLength(0);
        expectEachFieldOnce();
    });

    it("injects once main_content_container is rendered", async () => {
        document.body.innerHTML = `<div id="app"></div>`;

        inject();
        expect(ours()).toHaveLength(0);

        document.getElementById("app")!.innerHTML =
            `<div id="main_content_container"></div>`;
        await flushObservers();

        expect(ours()).toHaveLength(1);
        expectEachFieldOnce();
    });

    it("re-adds our fields when the page re-renders the container, keeping typed values", async () => {
        document.body.innerHTML = `<div id="app"><div id="main_content_container"></div></div>`;

        inject();
        document.querySelector<HTMLInputElement>("#customer-firstName")!.value = "Kari";

        // Container replaced by a re-render
        document.getElementById("app")!.innerHTML =
            `<div id="main_content_container"></div>`;
        await flushObservers();

        expect(ours()).toHaveLength(1);
        expect(document.querySelector<HTMLInputElement>("#customer-firstName")!.value).toBe("Kari");
    });

    it("saves to sessionStorage from our fields after BookVisit's are removed", async () => {
        document.body.innerHTML = `${NATIVE_FIELDS}<div id="main_content_container"></div>`;

        inject();
        document.querySelector(NATIVE_SECTION)!.remove();
        await flushObservers();

        const email = document.querySelector<HTMLInputElement>('input[name="emailAddress"]')!;
        expect(email.closest("[data-ei-autofields]")).not.toBeNull();
        email.value = "test@example.com";
        email.dispatchEvent(new Event("input"));

        expect(sessionStorage.getItem("autofield_email")).toBe("test@example.com");
    });

    it("stops syncing after destroy", async () => {
        document.body.innerHTML = `<div id="main_content_container">${NATIVE_FIELDS}</div>`;

        inject();
        tool.destroy();
        document.querySelector(NATIVE_SECTION)!.remove();
        await flushObservers();

        expect(ours()).toHaveLength(0);
    });

    it("stops syncing and removes our fields when leaving checkout", async () => {
        document.body.innerHTML = `<div id="main_content_container"></div>`;

        inject();
        expect(ours()).toHaveLength(1);

        window.history.pushState({}, "", "/payment");
        document.body.appendChild(document.createElement("div"));
        await flushObservers();

        expect(ours()).toHaveLength(0);
        expect((tool as any).autofieldObserver).toBeUndefined();
    });

    it("does not let a later input with the same name overwrite the saved value", () => {
        document.body.innerHTML = `
            <div id="main_content_container">${NATIVE_FIELDS}</div>
            <input name="phoneNumber" id="guest-phone">`;

        inject();

        const customerPhone = document.querySelector<HTMLInputElement>("#customer-phoneNumber")!;
        customerPhone.value = "12345678";
        customerPhone.dispatchEvent(new Event("input"));

        const guestPhone = document.querySelector<HTMLInputElement>("#guest-phone")!;
        guestPhone.value = "99999999";
        guestPhone.dispatchEvent(new Event("input"));

        expect(sessionStorage.getItem("autofield_phoneNumber")).toBe("12345678");
    });

    it("settles without looping after our own changes", async () => {
        document.body.innerHTML = `<div id="main_content_container"></div>`;

        inject();
        const sync = jest.spyOn(tool as any, "syncAutofields");
        const insert = jest.spyOn(Element.prototype, "insertAdjacentElement");
        await flushObservers();
        await flushObservers();

        expect(sync.mock.calls.length).toBeLessThanOrEqual(1);
        expect(insert).not.toHaveBeenCalled();
        insert.mockRestore();
    });
});
