import { trackedLinkFromReferrer } from "../src/utils/analytics-collector";

// The `?s=` tracked-link code is handed on from a same-site referrer so a
// landing page whose touch was never stored (CMP not answered) still
// attributes the visit (main repo lead 41506, 2026-09-26).
describe("trackedLinkFromReferrer", () => {
    test("picks the code up from a same-site referrer", () => {
        expect(
            trackedLinkFromReferrer(
                "https://www.oslosyn.no/gratis-undersokelse?s=QvP5",
                "www.oslosyn.no"
            )
        ).toEqual({ s: "QvP5" });
    });

    test("accepts a different subdomain of the same site", () => {
        expect(
            trackedLinkFromReferrer("https://oslosyn.no/?s=P02l", "booking.oslosyn.no")
        ).toEqual({ s: "P02l" });
    });

    test("ignores other sites", () => {
        expect(
            trackedLinkFromReferrer("https://www.google.com/?s=QvP5", "www.oslosyn.no")
        ).toEqual({});
    });

    test("two unrelated sites under a short public suffix are not the same site", () => {
        expect(
            trackedLinkFromReferrer("https://other.co.uk/?s=QvP5", "www.shop.co.uk")
        ).toEqual({});
        expect(
            trackedLinkFromReferrer("https://shop.co.uk/?s=QvP5", "www.shop.co.uk")
        ).toEqual({ s: "QvP5" });
    });

    test("ignores a site-search style value", () => {
        expect(
            trackedLinkFromReferrer(
                "https://www.oslosyn.no/?s=briller%20oslo",
                "www.oslosyn.no"
            )
        ).toEqual({});
        expect(
            trackedLinkFromReferrer("https://www.oslosyn.no/?s=ab", "www.oslosyn.no")
        ).toEqual({});
    });

    test("is empty without a referrer or with an unparsable one", () => {
        expect(trackedLinkFromReferrer("", "www.oslosyn.no")).toEqual({});
        expect(trackedLinkFromReferrer("not a url", "www.oslosyn.no")).toEqual({});
    });
});
