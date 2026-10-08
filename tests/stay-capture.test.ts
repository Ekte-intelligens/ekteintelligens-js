import {
    _resetStayCaptureForTests,
    applyStayToProducts,
    captureStayFromCurrentPage,
    clearStay,
    getCurrentStay,
    parseDateCandidates,
    parseStayFromUrl,
    startStayCapture,
    STAY_STORAGE_KEY,
} from "../src/tools/stay-capture";
import { countSessions } from "../src/utils/analytics-collector";

const setUrl = (href: string) => {
    window.history.replaceState({}, "", href);
};

describe("stay-capture: parsing", () => {
    it("reads the Elina listing-page pair (US from/to + NO start/end)", () => {
        const stay = parseStayFromUrl(
            "https://norgesbooking.no/se-alle-hytter/hemsedal/?from=12/27/2026&to=01/03/2027&start=27/12/2026&end=03/01/2027",
        );
        expect(stay).toMatchObject({
            checkin: "2026-12-27",
            checkout: "2027-01-03",
            url: "https://norgesbooking.no/se-alle-hytter/hemsedal/",
        });
        expect(typeof stay?.captured_at).toBe("string");
    });

    it("prefers US order for from/to alone", () => {
        const stay = parseStayFromUrl(
            "https://x.no/?from=03/01/2027&to=03/05/2027",
        );
        expect(stay).toMatchObject({
            checkin: "2027-03-01",
            checkout: "2027-03-05",
        });
    });

    it("prefers day-first order for start/end alone", () => {
        const stay = parseStayFromUrl(
            "https://x.no/?start=03/01/2027&end=05/01/2027",
        );
        expect(stay).toMatchObject({
            checkin: "2027-01-03",
            checkout: "2027-01-05",
        });
    });

    it("accepts ISO and dotted dates and guest counts", () => {
        const stay = parseStayFromUrl(
            "https://x.no/book?checkin=2026-07-01&checkout=05.07.2026&adults=2&children=1",
        );
        expect(stay).toMatchObject({
            checkin: "2026-07-01",
            checkout: "2026-07-05",
            adults: 2,
            children: 1,
        });
    });

    it("rejects checkout before/at checkin, long stays and garbage", () => {
        expect(
            parseStayFromUrl("https://x.no/?from=01/05/2027&to=01/05/2027"),
        ).toBeNull();
        expect(
            parseStayFromUrl("https://x.no/?from=01/05/2027&to=01/04/2027"),
        ).toBeNull();
        expect(
            parseStayFromUrl("https://x.no/?checkin=2027-01-01&checkout=2027-04-01"),
        ).toBeNull();
        expect(parseStayFromUrl("https://x.no/?from=A&to=B")).toBeNull();
        expect(parseStayFromUrl("https://x.no/")).toBeNull();
    });

    it("parseDateCandidates orders ambiguous readings by preference", () => {
        expect(parseDateCandidates("03/01/2027", "DMY")).toEqual([
            "2027-01-03",
            "2027-03-01",
        ]);
        expect(parseDateCandidates("27/12/2026", "MDY")).toEqual(["2026-12-27"]);
        expect(parseDateCandidates("31.02.2026", "DMY")).toEqual([]);
    });
});

describe("stay-capture: persistence and products", () => {
    beforeEach(() => {
        _resetStayCaptureForTests();
        localStorage.clear();
        setUrl("/");
    });

    it("captures from the page, stores it and clears on completion", () => {
        setUrl("/hytter/?from=12/27/2026&to=01/03/2027");
        startStayCapture({ enabled: true });
        const stored = JSON.parse(localStorage.getItem(STAY_STORAGE_KEY) ?? "null");
        expect(stored).toMatchObject({ checkin: "2026-12-27" });

        setUrl("/booking/confirm");
        expect(getCurrentStay()).toMatchObject({ checkin: "2026-12-27" });

        clearStay();
        expect(localStorage.getItem(STAY_STORAGE_KEY)).toBeNull();
        expect(getCurrentStay()).toBeNull();
    });

    it("does nothing when disabled", () => {
        setUrl("/hytter/?from=12/27/2026&to=01/03/2027");
        startStayCapture({ enabled: false });
        expect(captureStayFromCurrentPage()).toBeNull();
        expect(localStorage.getItem(STAY_STORAGE_KEY)).toBeNull();
        expect(getCurrentStay()).toBeNull();
    });

    it("drops a stored stay older than 7 days", () => {
        localStorage.setItem(
            STAY_STORAGE_KEY,
            JSON.stringify({
                checkin: "2026-12-27",
                checkout: "2027-01-03",
                captured_at: new Date(Date.now() - 8 * 86_400_000).toISOString(),
                url: "https://x.no/",
            }),
        );
        startStayCapture({ enabled: true });
        expect(getCurrentStay()).toBeNull();
        expect(localStorage.getItem(STAY_STORAGE_KEY)).toBeNull();
    });

    it("fills dates on rows without them, leaves dated rows and addons", () => {
        const stay = {
            checkin: "2026-12-27",
            checkout: "2027-01-03",
            captured_at: new Date().toISOString(),
            url: "https://x.no/",
        };
        const products = [
            { id: "1", name: "Hytte", type: "accommodation", price: 1000 },
            { id: "2", name: "Rom", type: "room", startDate: "2026-07-01", endDate: "2026-07-02" },
            { id: "3", name: "Ved", type: "addon", price: 100 },
        ];
        const out = applyStayToProducts(products, stay);
        expect(out[0]).toMatchObject({
            startDate: "2026-12-27",
            endDate: "2027-01-03",
            nights: 7,
        });
        expect(out[1]).toEqual(products[1]);
        expect(out[2]).toEqual(products[2]);
        expect(applyStayToProducts(products, null)).toBe(products);
    });
});

describe("countSessions", () => {
    it("groups page views by 30-minute gaps", () => {
        const t0 = Date.parse("2026-10-01T10:00:00Z");
        const m = 60_000;
        const visits = [
            { page: "/", enteredAt: t0, activeMs: 2 * m },
            { page: "/a", enteredAt: t0 + 5 * m, activeMs: m },
            { page: "/b", enteredAt: t0 + 50 * m, activeMs: m }, // > 30 min after /a ended
            { page: "/c", enteredAt: t0 + 60 * m, activeMs: m },
            { page: "/d", enteredAt: t0 + 24 * 60 * m, activeMs: m },
        ];
        expect(countSessions(visits)).toBe(3);
        expect(countSessions([])).toBe(0);
    });
});

describe("applyStayToProducts age gate", () => {
    const { applyStayToProducts } = require("../src/tools/stay-capture");
    const stay = (ageMs: number) => ({
        checkin: "2026-12-27",
        checkout: "2027-01-03",
        captured_at: new Date(Date.now() - ageMs).toISOString(),
        url: "https://x.no/hytter",
    });
    it("fills dates from a stay captured within the window", () => {
        const out = applyStayToProducts([{ name: "Fjellro" }], stay(60_000));
        expect(out[0].startDate).toBe("2026-12-27");
        expect(out[0].nights).toBe(7);
    });
    it("leaves products alone when the stay is older than the window", () => {
        const products = [{ name: "Fjellro" }];
        const out = applyStayToProducts(products, stay(2 * 24 * 60 * 60 * 1000));
        expect(out).toBe(products);
    });
});
