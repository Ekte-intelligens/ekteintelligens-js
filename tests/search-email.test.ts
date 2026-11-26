import { SearchEmailTool } from "../src/tools/search-email";
import { InputDetector } from "../src/utils/input-detector";
import { SDKOptions } from "../src/types";

const mockGetCheckoutCampaign = jest.fn();

jest.mock("../src/services/supabase-service", () => ({
    SupabaseService: jest.fn().mockImplementation(() => ({
        getCheckoutCampaign: mockGetCheckoutCampaign,
    })),
}));

const options: SDKOptions = {
    organizationId: "org",
    checkoutCampaignId: "bardola-campaign",
    features: { searchEmail: true },
};

const STORAGE_KEY = "ei_search_email";

/** BookVisit's search box, as rendered on booking.bardola.no. */
const renderSearchBox = () => {
    document.body.innerHTML = `
        <div id="calendar_search_content">
            <div id="calendarInnerWrapper">
                <div class="bv:bv_large:hidden"><button>Velg dato</button></div>
                <div class="bv:bv_medium:hidden">
                    <button data-testid="small_room_config_button">1 Enhet, 2 gjester</button>
                </div>
                <div class="bv:hidden bv:bv_medium:contents">
                    <button data-testid="large_room_config_button">1 Enhet, 2 gjester</button>
                </div>
                <div data-testid="button-row">
                    <div><button data-testid="promo_button">Jeg har en kode</button></div>
                    <span><button data-testid="search_button">Søk</button></span>
                </div>
            </div>
        </div>`;
};

const box = () => document.getElementById("calendarInnerWrapper") as HTMLElement;
const field = () => document.querySelector<HTMLElement>("[data-ei-search-email]");
const input = () => field()?.querySelector("input") as HTMLInputElement;

const type = (target: HTMLInputElement, value: string) => {
    target.value = value;
    target.dispatchEvent(new Event("input", { bubbles: true }));
};

/** Lets MutationObserver callbacks run, and CheckoutPrefill's 250 ms check. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 300));

const setPath = (path: string) => window.history.replaceState({}, "", path);

describe("SearchEmailTool", () => {
    let tool: SearchEmailTool;

    beforeEach(() => {
        document.body.innerHTML = "";
        document.getElementById("ei-search-email-style")?.remove();
        sessionStorage.clear();
        setPath("/no/accommodation");
        mockGetCheckoutCampaign.mockReset().mockResolvedValue({
            id: "bardola-campaign",
            type: "bookvisit",
            config: { bookvisit: { channel_id: "chan-1", search_email: true } },
        });
        tool = new SearchEmailTool(options);
    });

    afterEach(() => {
        tool.destroy();
        jest.restoreAllMocks();
    });

    it("puts the field between the guest picker and the code / search row", async () => {
        renderSearchBox();
        await tool.initialize();

        const children = Array.from(box().children);
        const row = document.querySelector('[data-testid="button-row"]');
        expect(children.indexOf(field()!)).toBe(children.indexOf(row!) - 1);
        expect(children[children.indexOf(field()!) - 1].textContent).toContain("gjester");
        expect(input().type).toBe("text");
        expect(input().autocomplete).toBe("email");
        expect(input().placeholder).not.toBe("");
    });

    it("labels the field in the page's language", async () => {
        document.documentElement.lang = "no";
        renderSearchBox();
        await tool.initialize();

        expect(input().placeholder).toBe("E-post");
        expect(input().getAttribute("aria-label")).toBe("E-post");
        document.documentElement.lang = "";
    });

    it("waits for the search box to render, and puts the field back after a re-render", async () => {
        await tool.initialize();
        expect(field()).toBeNull();

        renderSearchBox();
        await flush();
        expect(field()?.parentElement).toBe(box());
        type(input(), "guest@example.com");

        renderSearchBox();
        await flush();
        expect(field()?.parentElement).toBe(box());
        expect(input().value).toBe("guest@example.com");
    });

    it("keeps a complete address for the session and forgets it when cleared", async () => {
        renderSearchBox();
        await tool.initialize();

        type(input(), "guest@exa");
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
        type(input(), " guest@example.com ");
        expect(sessionStorage.getItem(STORAGE_KEY)).toBe("guest@example.com");
        type(input(), "");
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("shows the stored address after a page load", async () => {
        sessionStorage.setItem(STORAGE_KEY, "guest@example.com");
        renderSearchBox();
        await tool.initialize();

        expect(input().value).toBe("guest@example.com");
    });

    it("fills the address into the checkout email field once it renders", async () => {
        renderSearchBox();
        await tool.initialize();
        type(input(), "guest@example.com");

        setPath("/no/checkout");
        document.body.innerHTML = '<form><input id="customer-emailAddress" type="email"></form>';
        await flush();

        const checkout = document.getElementById("customer-emailAddress") as HTMLInputElement;
        expect(checkout.value).toBe("guest@example.com");
    });

    it("leaves an address the visitor typed at checkout", async () => {
        sessionStorage.setItem(STORAGE_KEY, "guest@example.com");
        setPath("/checkout");
        document.body.innerHTML = '<input type="email" value="typed@example.com">';
        await tool.initialize();
        await flush();

        expect(document.querySelector<HTMLInputElement>('input[type="email"]')?.value).toBe(
            "typed@example.com",
        );
    });

    it("does not fill email fields outside checkout", async () => {
        sessionStorage.setItem(STORAGE_KEY, "guest@example.com");
        document.body.innerHTML = '<input type="email">';
        await tool.initialize();
        await flush();

        expect(document.querySelector<HTMLInputElement>('input[type="email"]')?.value).toBe("");
    });

    it("does nothing without the campaign switch", async () => {
        mockGetCheckoutCampaign.mockResolvedValue({
            id: "bardola-campaign",
            type: "bookvisit",
            config: { bookvisit: { channel_id: "chan-1" } },
        });
        renderSearchBox();
        await tool.initialize();

        expect(field()).toBeNull();
    });

    it("does nothing without the feature flag", async () => {
        renderSearchBox();
        tool = new SearchEmailTool({ ...options, features: {} });
        await tool.initialize();

        expect(field()).toBeNull();
        expect(mockGetCheckoutCampaign).not.toHaveBeenCalled();
    });

    it("takes the field off the page on destroy", async () => {
        renderSearchBox();
        await tool.initialize();
        tool.destroy();

        expect(field()).toBeNull();
    });

    it("is not captured as cart content", async () => {
        renderSearchBox();
        await tool.initialize();
        const detector = new InputDetector(null);
        const update = jest.fn();
        detector.setOnContentUpdate(update);
        detector.startListening();

        type(input(), "guest@example.com");
        input().dispatchEvent(new Event("blur"));

        expect(update).not.toHaveBeenCalled();
        expect(detector.getContent()).toEqual({});
    });
});
