import { CartRestoreTool } from "../src/tools/cart-restore";
import { AbandonedCartTool } from "../src/tools/abandoned-cart";
import { SDKOptions } from "../src/types";

const mockGetCheckoutCampaign = jest.fn();
const mockGetCartRestore = jest.fn();
const mockCreateAssistantEvent = jest.fn();

jest.mock("../src/services/supabase-service", () => ({
    SupabaseService: jest.fn().mockImplementation(() => ({
        getCheckoutCampaign: mockGetCheckoutCampaign,
        getCartRestore: mockGetCartRestore,
        createAssistantEvent: mockCreateAssistantEvent,
    })),
}));

const ROOM_ID = "2c7d6905-c77b-4f20-be5d-6c27c6d35518";
const RATE_PLAN_ID = "rp-selvhushold";
const RATE_PLAN_NAME = "Leilighet inkl. selvhushold";

const options: SDKOptions = {
    organizationId: "org",
    checkoutCampaignId: "bardola-campaign",
    features: { cartRestore: true },
};

/** The Bardøla room product as stored by v1.4.0 (with ratePlanId). */
const storedRoom = (overrides: Record<string, any> = {}) => ({
    id: ROOM_ID,
    name: "Studio comfort",
    type: "room",
    price: 6584,
    endDate: "2099-06-27",
    quantity: 1,
    ratePlan: RATE_PLAN_NAME,
    ratePlanId: RATE_PLAN_ID,
    startDate: "2099-06-23",
    roomConfig: {
        adults: 2,
        childAges: null,
        sharerAge: null,
        ageGroupDescription: null,
    },
    ...overrides,
});

const SEARCH = "/accommodation/search-v1";
const ADD = "/baskets/rooms/add-v1";

interface FakeRate {
    ratePlanId: string;
    hitKey: string;
    totalPrice: number;
    isLocked?: boolean;
}

/** Shaped like a real booking.bardola.no search-v1 response. */
const searchResponse = (
    rates: FakeRate[],
    roomConfig = { adults: 2, childAges: [] as number[] },
) => ({
    resultId: "result-1",
    currencyCode: "NOK",
    ratePlanContent: [
        { ratePlanId: RATE_PLAN_ID, name: RATE_PLAN_NAME, description: null },
        { ratePlanId: "rp-other", name: "Fleksibel", description: null },
    ],
    roomsResult: [
        {
            roomId: ROOM_ID,
            isPackage: false,
            rateAlternatives: rates.map((rate) => ({
                currency: "NOK",
                displayName: "display name",
                rateplanId: rate.ratePlanId,
                packageId: null,
                searchRoomNumber: 1,
                ratesPerRoomConfig: [
                    {
                        roomConfig: { ...roomConfig, sharerAge: null, ageGroupDescription: null },
                        hitKey: rate.hitKey,
                        isLocked: rate.isLocked ?? false,
                        lockType: rate.isLocked ? "MyPage" : "NoLock",
                        totalPrice: {
                            priceInclVAT: rate.totalPrice,
                            displayPrice: rate.totalPrice,
                        },
                    },
                ],
            })),
        },
    ],
});

const json = (body: any, status = 200) =>
    Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        statusText: "",
        json: () => Promise.resolve(body),
    } as Response);

interface FetchPlan {
    basket?: () => Promise<Response>;
    search?: (body: any) => Promise<Response>;
    add?: (body: any) => Promise<Response>;
}

let fetchMock: jest.Mock;

const installFetch = (plan: FetchPlan) => {
    fetchMock = jest.fn((url: string, init: RequestInit) => {
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        if (url.includes("/baskets/basket-v1")) {
            return plan.basket
                ? plan.basket()
                : json({ booking: { bookingData: { rooms: [] } } });
        }
        if (url.includes(SEARCH)) {
            return plan.search
                ? plan.search(body)
                : json(
                      searchResponse([
                          { ratePlanId: RATE_PLAN_ID, hitKey: "hit-1", totalPrice: 6584 },
                      ]),
                  );
        }
        if (url.includes(ADD)) {
            return plan.add ? plan.add(body) : json({ success: true, errorString: null });
        }
        return Promise.reject(new Error(`Unexpected fetch ${url}`));
    });
    (global as any).fetch = fetchMock;
};

const callsTo = (path: string) =>
    fetchMock.mock.calls.filter(([url]) => String(url).includes(path));

const setUrl = (search: string) =>
    window.history.replaceState({}, "", `/checkout${search}`);

const setToken = () => {
    document.cookie = "bv_jwt=fresh-token; path=/";
};

const clearToken = () => {
    document.cookie = "bv_jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
};

const banners = () =>
    Array.from(document.querySelectorAll("[data-ei-restore-banner]")).map(
        (banner) => banner.textContent ?? "",
    );

const overlay = () => document.querySelector("[data-ei-restore-overlay]");

const CONTACT_KEY = "ei_cart_restore_contact";

const addField = (attributes: { type: string; autocomplete?: string; value?: string }) => {
    const field = document.createElement("input");
    field.type = attributes.type;
    if (attributes.autocomplete) field.setAttribute("autocomplete", attributes.autocomplete);
    if (attributes.value) field.value = attributes.value;
    document.body.appendChild(field);
    return field;
};

/** Longer than CheckoutPrefill's 250 ms check. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 300));

describe("CartRestoreTool", () => {
    let navigate: jest.SpyInstance;

    beforeEach(() => {
        jest.useRealTimers();
        document.body.innerHTML = "";
        sessionStorage.clear();
        localStorage.clear();
        setUrl("?s=abc123&lang=nb");
        setToken();
        installFetch({});
        mockGetCheckoutCampaign.mockReset().mockResolvedValue({
            id: "bardola-campaign",
            type: "bookvisit",
            config: { bookvisit: { channel_id: "chan-1", restore: true } },
        });
        mockGetCartRestore.mockReset().mockResolvedValue({
            session_id: "original-session",
            products: [storedRoom()],
        });
        mockCreateAssistantEvent.mockReset().mockResolvedValue(true);
        navigate = jest
            .spyOn(CartRestoreTool.prototype as any, "navigate")
            .mockImplementation(() => undefined);
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        jest.spyOn(console, "warn").mockImplementation(() => undefined);
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        clearToken();
    });

    it("restores the room, adopts the session and continues to add-ons", async () => {
        const tool = new CartRestoreTool(options);
        await tool.initialize();

        expect(mockGetCartRestore).toHaveBeenCalledWith("abc123");
        const [, searchInit] = callsTo(SEARCH)[0];
        const searchBody = JSON.parse(String(searchInit.body));
        expect(searchInit.method).toBe("POST");
        expect(searchBody).toMatchObject({
            channelId: "chan-1",
            startDate: "2099-06-23",
            endDate: "2099-06-27",
            roomConfigs: [{ adults: 2, childAges: [] }],
            filter: { includeRooms: true },
        });
        expect(searchBody.filter.promoCode).toBeUndefined();
        const [, addInit] = callsTo(ADD)[0];
        expect(addInit.method).toBe("PATCH");
        expect(JSON.parse(String(addInit.body))).toEqual({
            hitkey: "hit-1",
            nrOfUnits: 1,
            resultId: "result-1",
            useExistingBasket: false,
            channelId: "chan-1",
        });
        expect(navigate).toHaveBeenCalledWith("/checkout?lang=nb");
        expect(localStorage.getItem("ei_session_id")).toBe("original-session");
        expect(tool.getLastOutcome()).toBe("restored");
        expect(banners()).toEqual([]);
        expect(sessionStorage.getItem("ei_cart_restore_notices")).toBeNull();
        expect(mockCreateAssistantEvent).toHaveBeenCalledWith({
            id_short_encoded: "abc123",
            type: "cart_restore",
            outcome: "restored",
        });
    });

    it("keeps the language prefix when continuing to checkout", async () => {
        window.history.replaceState({}, "", "/no/accommodation?s=abc123");
        await new CartRestoreTool(options).initialize();

        expect(navigate).toHaveBeenCalledWith("/no/checkout");
    });

    it("fills the saved email into checkout once the form renders", async () => {
        mockGetCartRestore.mockResolvedValue({
            session_id: "original-session",
            products: [storedRoom()],
            email: " guest@example.com ",
        });
        await new CartRestoreTool(options).initialize();
        expect(navigate).toHaveBeenCalled();
        expect(JSON.parse(sessionStorage.getItem(CONTACT_KEY) ?? "null")).toEqual({
            email: "guest@example.com",
        });

        setUrl("");
        const tool = new CartRestoreTool(options);
        await tool.initialize();
        const field = addField({ type: "email" });
        const typed = jest.fn();
        field.addEventListener("input", typed);
        await flush();

        expect(field.value).toBe("guest@example.com");
        expect(typed).toHaveBeenCalled();
        expect(sessionStorage.getItem(CONTACT_KEY)).toBeNull();
        tool.destroy();
    });

    it("fills a split country code and phone number (BookVisit's form)", async () => {
        mockGetCartRestore.mockResolvedValue({
            session_id: "original-session",
            products: [storedRoom()],
            email: "guest@example.com",
            phone: "+47 912 34 567",
            phone_country_code: "+47",
        });
        await new CartRestoreTool(options).initialize();

        setUrl("");
        const tool = new CartRestoreTool(options);
        await tool.initialize();
        const email = addField({ type: "email" });
        const code = addField({ type: "tel", autocomplete: "tel-country-code" });
        const number = addField({ type: "tel", autocomplete: "tel-national" });
        await flush();

        expect(email.value).toBe("guest@example.com");
        expect(code.value).toBe("47");
        expect(number.value).toBe("91234567");
        tool.destroy();
    });

    it("fills fields again when the form resets them", async () => {
        sessionStorage.setItem(CONTACT_KEY, JSON.stringify({ email: "guest@example.com" }));
        const field = addField({ type: "email" });
        setUrl("");
        const tool = new CartRestoreTool(options);
        await tool.initialize();
        expect(field.value).toBe("guest@example.com");

        field.value = "";
        await flush();
        expect(field.value).toBe("guest@example.com");
        tool.destroy();
    });

    it("stops filling a field once the visitor types in it", async () => {
        sessionStorage.setItem(CONTACT_KEY, JSON.stringify({ email: "guest@example.com" }));
        const field = addField({ type: "email" });
        setUrl("");
        const tool = new CartRestoreTool(options);
        await tool.initialize();

        field.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
        field.value = "";
        await flush();
        expect(field.value).toBe("");
        tool.destroy();
    });

    it("fills the full number into a single phone field", async () => {
        sessionStorage.setItem(
            CONTACT_KEY,
            JSON.stringify({ phone: "91234567", phoneCountryCode: "47" }),
        );
        addField({ type: "tel" });
        setUrl("");
        await new CartRestoreTool(options).initialize();

        expect(document.querySelector<HTMLInputElement>('input[type="tel"]')?.value).toBe(
            "+4791234567",
        );
    });

    it("leaves fields the visitor already typed", async () => {
        sessionStorage.setItem(
            CONTACT_KEY,
            JSON.stringify({ email: "guest@example.com", phone: "91234567" }),
        );
        const email = addField({ type: "email", value: "typed@example.com" });
        const phone = addField({ type: "tel", value: "40000000" });
        setUrl("");
        await new CartRestoreTool(options).initialize();

        expect(email.value).toBe("typed@example.com");
        expect(phone.value).toBe("40000000");
    });

    it("does not carry invalid contact details over", async () => {
        mockGetCartRestore.mockResolvedValue({
            session_id: "original-session",
            products: [storedRoom()],
            email: "not-an-email",
            phone: "12",
        });
        await new CartRestoreTool(options).initialize();

        expect(navigate).toHaveBeenCalled();
        expect(sessionStorage.getItem(CONTACT_KEY)).toBeNull();
    });

    it("reports a price change on the page it continues to", async () => {
        installFetch({
            search: () =>
                json(
                    searchResponse([
                        { ratePlanId: RATE_PLAN_ID, hitKey: "hit-1", totalPrice: 7100 },
                    ]),
                ),
        });
        const tool = new CartRestoreTool(options);
        await tool.initialize();

        expect(tool.getLastOutcome()).toBe("restored_price_changed");
        expect(navigate).toHaveBeenCalled();
        expect(banners()).toEqual([]);

        setUrl("");
        await new CartRestoreTool(options).initialize();
        expect(banners()).toHaveLength(1);
        expect(banners()[0]).toMatch(/price has changed/);
        expect(banners()[0]).toMatch(/6,584/);
        expect(banners()[0]).toMatch(/7,100/);
        expect(sessionStorage.getItem("ei_cart_restore_notices")).toBeNull();
    });

    it("applies our promo code and tells the visitor what they save", async () => {
        mockGetCartRestore.mockResolvedValue({
            session_id: "original-session",
            products: [storedRoom()],
            promo_code: "COMEBACK10",
        });
        installFetch({
            search: (body) =>
                json(
                    searchResponse([
                        body.filter.promoCode === "COMEBACK10"
                            ? { ratePlanId: RATE_PLAN_ID, hitKey: "hit-promo", totalPrice: 5926 }
                            : { ratePlanId: RATE_PLAN_ID, hitKey: "hit-1", totalPrice: 6584 },
                    ]),
                ),
        });
        const tool = new CartRestoreTool(options);
        await tool.initialize();

        expect(callsTo(SEARCH)).toHaveLength(2);
        const [, addInit] = callsTo(ADD)[0];
        expect(JSON.parse(String(addInit.body)).hitkey).toBe("hit-promo");
        expect(tool.getLastOutcome()).toBe("restored");

        await new CartRestoreTool(options).initialize();
        expect(banners()).toHaveLength(1);
        expect(banners()[0]).toMatch(/COMEBACK10/);
        expect(banners()[0]).toMatch(/658/);
    });

    it("matches carts saved before ratePlanId was stored by rate plan name", async () => {
        mockGetCartRestore.mockResolvedValue({
            session_id: "original-session",
            products: [storedRoom({ ratePlanId: undefined })],
        });
        installFetch({
            search: () =>
                json(
                    searchResponse([
                        { ratePlanId: "rp-other", hitKey: "hit-other", totalPrice: 5000 },
                        { ratePlanId: RATE_PLAN_ID, hitKey: "hit-1", totalPrice: 6584 },
                    ]),
                ),
        });
        const tool = new CartRestoreTool(options);
        await tool.initialize();

        const [, addInit] = callsTo(ADD)[0];
        expect(JSON.parse(String(addInit.body)).hitkey).toBe("hit-1");
        expect(tool.getLastOutcome()).toBe("restored");
    });

    it("restores every room of a multi-room cart with its own hitKey", async () => {
        mockGetCartRestore.mockResolvedValue({
            session_id: "original-session",
            products: [storedRoom(), storedRoom({ roomConfig: { adults: 1, childAges: [4] } })],
        });
        // As BookVisit returns it: one hitKey per searched room config, in
        // a different order than requested.
        const response = searchResponse([]);
        response.roomsResult[0].rateAlternatives = [
            {
                currency: "NOK",
                displayName: RATE_PLAN_NAME,
                rateplanId: RATE_PLAN_ID,
                packageId: null,
                searchRoomNumber: 2,
                ratesPerRoomConfig: [
                    {
                        roomConfig: { adults: 1, childAges: [4], sharerAge: null, ageGroupDescription: null },
                        hitKey: "hit-child",
                        isLocked: false,
                        lockType: "NoLock",
                        totalPrice: { priceInclVAT: 6584, displayPrice: 6584 },
                    },
                    {
                        roomConfig: { adults: 2, childAges: [], sharerAge: null, ageGroupDescription: null },
                        hitKey: "hit-adults",
                        isLocked: false,
                        lockType: "NoLock",
                        totalPrice: { priceInclVAT: 6584, displayPrice: 6584 },
                    },
                ],
            },
        ];
        installFetch({ search: () => json(response) });
        const tool = new CartRestoreTool(options);
        await tool.initialize();

        const [, searchInit] = callsTo(SEARCH)[0];
        expect(JSON.parse(String(searchInit.body)).roomConfigs).toEqual([
            { adults: 2, childAges: [] },
            { adults: 1, childAges: [4] },
        ]);
        expect(
            callsTo(ADD).map(([, init]) => {
                const body = JSON.parse(String(init.body));
                return [body.hitkey, body.useExistingBasket];
            }),
        ).toEqual([
            ["hit-adults", false],
            ["hit-child", true],
        ]);
        expect(tool.getLastOutcome()).toBe("restored");
    });

    it("skips member-only rates even when they are cheaper", async () => {
        installFetch({
            search: () =>
                json(
                    searchResponse([
                        { ratePlanId: RATE_PLAN_ID, hitKey: "hit-member", totalPrice: 6255, isLocked: true },
                        { ratePlanId: RATE_PLAN_ID, hitKey: "hit-1", totalPrice: 6584 },
                    ]),
                ),
        });
        const tool = new CartRestoreTool(options);
        await tool.initialize();

        const [, addInit] = callsTo(ADD)[0];
        expect(JSON.parse(String(addInit.body)).hitkey).toBe("hit-1");
        expect(tool.getLastOutcome()).toBe("restored");
    });

    it("shows the fallback message when BookVisit refuses the room", async () => {
        installFetch({
            add: () => json({ success: false, errorString: "Room not available" }),
        });
        const tool = new CartRestoreTool(options);
        await tool.initialize();

        expect(navigate).not.toHaveBeenCalled();
        expect(tool.getLastOutcome()).toBe("failed");
        expect(banners()[0]).toMatch(/could not restore/);
    });

    it("leaves a live basket alone", async () => {
        installFetch({
            basket: () =>
                json({ booking: { bookingData: { rooms: [{ roomId: ROOM_ID }] } } }),
        });
        const tool = new CartRestoreTool(options);
        await tool.initialize();

        expect(callsTo(SEARCH)).toHaveLength(0);
        expect(navigate).not.toHaveBeenCalled();
        expect(localStorage.getItem("ei_session_id")).toBeNull();
        expect(tool.getLastOutcome()).toBe("basket_exists");
        expect(banners()).toEqual([]);
        expect(overlay()).toBeNull();
    });

    it("shows 'no longer available' when the room is sold out", async () => {
        installFetch({
            search: () => json({ ...searchResponse([]), roomsResult: [] }),
        });
        const tool = new CartRestoreTool(options);
        await tool.initialize();

        expect(callsTo(ADD)).toHaveLength(0);
        expect(navigate).not.toHaveBeenCalled();
        expect(tool.getLastOutcome()).toBe("unavailable");
        expect(banners()[0]).toMatch(/no longer available/);
        expect(overlay()).toBeNull();
    });

    it("does not substitute another rate when the stored rate plan is gone", async () => {
        installFetch({
            search: () =>
                json(
                    searchResponse([
                        { ratePlanId: "rp-other", hitKey: "hit-other", totalPrice: 5000 },
                    ]),
                ),
        });
        const tool = new CartRestoreTool(options);
        await tool.initialize();

        expect(callsTo(ADD)).toHaveLength(0);
        expect(tool.getLastOutcome()).toBe("unavailable");
    });

    it("restores none of a multi-room cart when one room is gone", async () => {
        mockGetCartRestore.mockResolvedValue({
            session_id: "original-session",
            products: [storedRoom(), storedRoom({ id: "sold-out-room" })],
        });
        const tool = new CartRestoreTool(options);
        await tool.initialize();

        expect(callsTo(ADD)).toHaveLength(0);
        expect(tool.getLastOutcome()).toBe("unavailable");
    });

    it("treats a stay in the past as unavailable without searching", async () => {
        mockGetCartRestore.mockResolvedValue({
            session_id: "original-session",
            products: [storedRoom({ startDate: "2020-01-01", endDate: "2020-01-03" })],
        });
        const tool = new CartRestoreTool(options);
        await tool.initialize();

        expect(callsTo(SEARCH)).toHaveLength(0);
        expect(tool.getLastOutcome()).toBe("unavailable");
    });

    it("shows the fallback message for an expired or unknown link", async () => {
        mockGetCartRestore.mockResolvedValue(null);
        const tool = new CartRestoreTool(options);
        await tool.initialize();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(tool.getLastOutcome()).toBe("invalid_link");
        expect(banners()[0]).toMatch(/could not restore/);
        expect(overlay()).toBeNull();
    });

    it("gives up when bv_jwt never appears", async () => {
        jest.useFakeTimers();
        clearToken();
        const tool = new CartRestoreTool(options);
        const done = tool.initialize();

        await jest.advanceTimersByTimeAsync(100);
        expect(overlay()).not.toBeNull();

        await jest.advanceTimersByTimeAsync(8000);
        await done;
        expect(overlay()).toBeNull();
        expect(tool.getLastOutcome()).toBe("no_token");
        expect(banners()[0]).toMatch(/could not restore/);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("removes the overlay and aborts requests at the timeout when the API hangs", async () => {
        jest.useFakeTimers();
        let basketSignal: AbortSignal | undefined;
        fetchMock = jest.fn((_url: string, init: RequestInit) => {
            basketSignal = init.signal ?? undefined;
            return new Promise<Response>(() => undefined);
        });
        (global as any).fetch = fetchMock;

        const tool = new CartRestoreTool(options);
        const done = tool.initialize();

        await jest.advanceTimersByTimeAsync(7999);
        expect(overlay()).not.toBeNull();

        await jest.advanceTimersByTimeAsync(1);
        expect(overlay()).toBeNull();
        expect(basketSignal?.aborted).toBe(true);

        await done;
        expect(tool.getLastOutcome()).toBe("timeout");
        expect(banners()[0]).toMatch(/could not restore/);
        expect(navigate).not.toHaveBeenCalled();
    });

    it("stops quietly when the visitor closes the overlay", async () => {
        fetchMock = jest.fn(() => new Promise<Response>(() => undefined));
        (global as any).fetch = fetchMock;

        const tool = new CartRestoreTool(options);
        const done = tool.initialize();
        await new Promise((resolve) => setTimeout(resolve, 0));
        document.querySelector<HTMLButtonElement>(
            "[data-ei-restore-overlay] [data-ei-restore-close]",
        )!.click();
        await done;

        expect(tool.getLastOutcome()).toBe("cancelled");
        expect(overlay()).toBeNull();
        expect(banners()).toEqual([]);
    });

    it("runs only once for the same s across page loads", async () => {
        await new CartRestoreTool(options).initialize();
        await new CartRestoreTool(options).initialize();

        expect(mockGetCartRestore).toHaveBeenCalledTimes(1);
        expect(callsTo(ADD)).toHaveLength(1);
    });

    it("does nothing when the campaign switch is off", async () => {
        mockGetCheckoutCampaign.mockResolvedValue({
            id: "bardola-campaign",
            type: "bookvisit",
            config: { bookvisit: { channel_id: "chan-1" } },
        });
        const tool = new CartRestoreTool(options);
        await tool.initialize();

        expect(mockGetCartRestore).not.toHaveBeenCalled();
        expect(mockCreateAssistantEvent).not.toHaveBeenCalled();
        expect(overlay()).toBeNull();
        expect(tool.getLastOutcome()).toBeUndefined();
    });

    it("stores the rate plan id on uploaded room products", () => {
        const cartTool = new AbandonedCartTool(options);
        const { products } = (cartTool as any).extractBookVisitProductsAndTotal({
            booking: {
                bookingData: {
                    totalPrice: 6584,
                    rooms: [
                        {
                            roomId: ROOM_ID,
                            totalPrice: 6584,
                            startDate: "2099-06-23",
                            endDate: "2099-06-27",
                            roomConfig: { adults: 2, childAges: [] },
                            priceInfo: [{ ratePlanId: RATE_PLAN_ID }],
                        },
                    ],
                    ratePlanDescriptions: [{ id: RATE_PLAN_ID, name: RATE_PLAN_NAME }],
                },
            },
        });

        expect(products[0]).toMatchObject({
            id: ROOM_ID,
            ratePlanId: RATE_PLAN_ID,
            ratePlan: RATE_PLAN_NAME,
        });
    });

    it("does nothing without an s parameter", async () => {
        setUrl("");
        await new CartRestoreTool(options).initialize();

        expect(mockGetCheckoutCampaign).not.toHaveBeenCalled();
        expect(overlay()).toBeNull();
    });
});
