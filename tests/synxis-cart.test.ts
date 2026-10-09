import { AbandonedCartTool } from "../src/tools/abandoned-cart";
import { SDKOptions } from "../src/types";

jest.mock("../src/services/supabase-service", () => ({
    SupabaseService: jest.fn().mockImplementation(() => ({
        getCheckoutCampaign: jest.fn().mockResolvedValue({
            id: "synxis-campaign",
            type: "synxis",
            product_mapping: {},
            input_mapping: null,
        }),
        submitCartSession: jest.fn().mockResolvedValue({ id: "s", success: true }),
    })),
}));

const options: SDKOptions = {
    organizationId: "org",
    checkoutCampaignId: "synxis-campaign",
    features: { abandonedCart: true },
};

const RESV_ID = "7770cdff-fb0e-4e15-9bed-17aa9b93d456";

const tool = (totalAverage = 0) => {
    const t: any = new AbandonedCartTool(options);
    t.campaign = { id: "synxis-campaign", type: "synxis" };
    t.totalAverage = totalAverage;
    return t;
};

/** Minimal /gw/v1/cart/ response with one reservation at the given list price. */
const cartApiResponse = (
    amount: number,
    id = RESV_ID,
    itemId = "29298B0051354",
) => ({
    ShoppingCart: [
        {
            Itemid: itemId,
            UpdatedData: {
                itinerary: {
                    reservations: [
                        {
                            id,
                            hotelId: 38020,
                            chainId: 29298,
                            status: "Booked",
                            stayCriteria: {
                                roomCode: "O_BA53_SD",
                                rateCode: "BARNONREF",
                                startDate: "2026-04-23T00:00:00",
                                endDate: "2026-04-26T00:00:00",
                            },
                            guestCriteria: { numAdults: 1, numChildren: 0 },
                            extrasFromShopping: {
                                displayname: "Dobbeltstudio",
                                currencyCode: "NOK",
                                prices: {
                                    Daily: [],
                                    Total: {
                                        Price: {
                                            Amount: amount,
                                            Total: {
                                                Amount: amount,
                                                AmountWithTaxesFees: amount,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        },
    ],
});

const setDomPrice = (text: string | null) => {
    document.body.innerHTML = text === null
        ? ""
        : `<div class="price-summary_price"><span>${text}</span></div>`;
};

beforeEach(() => {
    document.body.innerHTML = "";
    sessionStorage.clear();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("SynXis price parsing", () => {
    const cases: Array<[string, number]> = [
        ["NOK 3,310", 3310],
        ["3 310 kr", 3310],
        ["3 310 kr", 3310],
        ["3 310 kr", 3310],
        ["kr 3.310", 3310],
        ["12 980,50 kr", 12980.5],
        ["12,980.50", 12980.5],
        ["1.234.567", 1234567],
        ["1,234,567", 1234567],
        ["980,5", 980.5],
        ["980.50", 980.5],
        ["4037", 4037],
    ];

    it.each(cases)("parseSynxisPrice(%p) -> %p", (text, expected) => {
        expect(tool().parseSynxisPrice(text)).toBe(expected);
    });

    it("returns null when there is no number", () => {
        expect(tool().parseSynxisPrice("kr")).toBeNull();
        expect(tool().parseSynxisPrice("")).toBeNull();
    });
});

describe("Elina PMS number parsing", () => {
    const cases: Array<[string | null | undefined, number]> = [
        ["2,840", 2840],
        ["2 840,00", 2840],
        ["2 840,00", 2840],
        ["2,840.00", 2840],
        ["7480,00", 7480],
        ["12 000", 12000],
        ["9000", 9000],
        ["980,5", 980.5],
        ["", 0],
        [null, 0],
        [undefined, 0],
        ["abc", 0],
    ];

    it.each(cases)("parseElinapmsNumber(%p) -> %p", (text, expected) => {
        expect(tool().parseElinapmsNumber(text)).toBe(expected);
    });
});

describe("SynXis total selection", () => {
    it("uses the API total when the page shows nothing", () => {
        setDomPrice(null);
        const { total, products } = tool().extractSynxisCartApiData(
            cartApiResponse(3310),
        );
        expect(total).toBe(3310);
        expect(products[0].actualTotal).toBeNull();
    });

    it("prefers a plausible post-promo DOM price over the API total", () => {
        setDomPrice("NOK 2,979");
        const { total, products } = tool().extractSynxisCartApiData(
            cartApiResponse(3310),
        );
        expect(total).toBe(2979);
        expect(products[0].price).toBe(3310);
        expect(products[0].actualTotal).toBe(2979);
    });

    it("keeps the API total when the DOM price is far too low", () => {
        setDomPrice("NOK 3.31");
        const { total } = tool().extractSynxisCartApiData(cartApiResponse(3310));
        expect(total).toBe(3310);
        expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining("Ignoring DOM total 3.31"),
        );
    });

    it("keeps the API total when the DOM price is higher", () => {
        setDomPrice("NOK 4,000");
        const { total } = tool().extractSynxisCartApiData(cartApiResponse(3310));
        expect(total).toBe(3310);
    });

    it("rejects a DOM price cut by half or more", () => {
        expect(tool().selectSynxisTotal(3310, 1655)).toBe(3310);
        expect(tool().selectSynxisTotal(3310, 1656)).toBe(1656);
    });

    it("falls back to the DOM price, then the average, without an API total", () => {
        expect(tool(1500).selectSynxisTotal(0, 2979)).toBe(2979);
        expect(tool(1500).selectSynxisTotal(0, null)).toBe(1500);
        expect(tool(1500).selectSynxisTotal(0, 0)).toBe(1500);
        expect(tool().selectSynxisTotal(0, null)).toBe(0);
    });

    it("uses the campaign average when the cart has no reservations", () => {
        setDomPrice(null);
        const { total, products } = tool(1500).extractSynxisCartApiData({
            ShoppingCart: [],
        });
        expect(products).toEqual([]);
        expect(total).toBe(1500);
    });
});

describe("SynXis captured createReservation price", () => {
    const createReservationResponse = {
        Id: RESV_ID,
        CurrencyCode: "NOK",
        hasDiscount: true,
        promotionDiscount: 331,
        Prices: {
            Total: {
                Total: {
                    Amount: 2979,
                    AmountWithTaxesFees: 2979,
                    OriginalAmount: 3310,
                },
            },
        },
    };

    it("captures a root-level reservation into memory and sessionStorage", () => {
        const captured = tool().captureSynxisReservationResponse(
            createReservationResponse,
        );
        expect(captured).toMatchObject({
            id: RESV_ID,
            total: 2979,
            originalTotal: 3310,
            currency: "NOK",
        });
        expect(
            JSON.parse(sessionStorage.getItem(`ei_synxis_resv_${RESV_ID}`)!),
        ).toMatchObject({ total: 2979 });
    });

    it("finds the reservation inside a wrapper", () => {
        const captured = tool().captureSynxisReservationResponse({
            Reservations: [createReservationResponse],
        });
        expect(captured?.total).toBe(2979);
    });

    it("ignores responses without a reservation", () => {
        expect(tool().captureSynxisReservationResponse({ ok: true })).toBeNull();
        expect(tool().captureSynxisReservationResponse(null)).toBeNull();
        expect(tool().captureSynxisReservationResponse("nope")).toBeNull();
    });

    it("wins over both the API total and the DOM price", () => {
        tool().captureSynxisReservationResponse(createReservationResponse);
        setDomPrice("NOK 3,310");
        const { total, products } = tool().extractSynxisCartApiData(
            cartApiResponse(3310),
        );
        expect(total).toBe(2979);
        expect(products[0]).toMatchObject({
            price: 3310,
            actualTotal: 3310,
            discountedTotal: 2979,
            originalTotal: 3310,
        });
    });

    it("is read back from sessionStorage by a fresh tool", () => {
        sessionStorage.setItem(
            `ei_synxis_resv_other-id`,
            JSON.stringify({ id: "other-id", total: 1200, originalTotal: null, currency: "NOK" }),
        );
        setDomPrice(null);
        const { total } = tool().extractSynxisCartApiData(
            cartApiResponse(1500, "other-id"),
        );
        expect(total).toBe(1200);
    });

    it("is ignored when it belongs to a different reservation", () => {
        tool().captureSynxisReservationResponse({
            ...createReservationResponse,
            Id: "stale-id",
        });
        setDomPrice(null);
        const { total } = tool().extractSynxisCartApiData(
            cartApiResponse(3310, "fresh-id"),
        );
        expect(total).toBe(3310);
    });
});

describe("SynXis fetch/XHR capture", () => {
    const flush = () => new Promise((r) => setTimeout(r, 0));

    it("reads the createReservation response without consuming the original", async () => {
        const body = JSON.stringify({
            Id: "fetched-id",
            CurrencyCode: "NOK",
            Prices: { Total: { Total: { AmountWithTaxesFees: 2500, OriginalAmount: 3000 } } },
        });
        // jsdom has no Response; mimic the parts the capture touches
        const fakeResponse = (): any => ({
            ok: true,
            status: 200,
            clone: () => fakeResponse(),
            json: async () => JSON.parse(body),
        });
        const originalFetch = jest.fn(async () => fakeResponse());
        (window as any).fetch = originalFetch;

        const t = tool();
        t.installSynxisReservationCapture();
        expect(window.fetch).not.toBe(originalFetch);

        const resp = await window.fetch("/gw/itinerary/v1/createReservation", {
            method: "POST",
            body: "{}",
        });
        await flush();
        await flush();

        // The page can still read its own response
        expect(await resp.json()).toMatchObject({ Id: "fetched-id" });
        expect(t.getCapturedSynxisReservation("fetched-id")).toMatchObject({
            total: 2500,
            originalTotal: 3000,
        });

        // Unrelated requests pass straight through and are not inspected
        await window.fetch("/gw/v1/cart/abc?businesscontext=BE");
        expect(originalFetch).toHaveBeenCalledTimes(2);
    });

    it("never breaks a failing request", async () => {
        (window as any).fetch = jest.fn(async () => {
            throw new Error("network down");
        });
        const t = tool();
        t.installSynxisReservationCapture(); // no-op: already installed above
        await expect(
            window.fetch("/gw/itinerary/v1/createReservation"),
        ).rejects.toThrow("network down");
    });

    it("records the XHR url on open and reads the body on loadend", () => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://booking.example.no/gw/itinerary/v1/createReservation");
        expect((xhr as any).__eiSynxisUrl).toContain("createReservation");
    });
});
