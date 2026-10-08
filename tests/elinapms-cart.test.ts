import { AbandonedCartTool } from "../src/tools/abandoned-cart";
import { SDKOptions } from "../src/types";

jest.mock("../src/services/supabase-service", () => ({
    SupabaseService: jest.fn().mockImplementation(() => ({
        getCheckoutCampaign: jest.fn().mockResolvedValue({
            id: "elina-campaign",
            type: "elinapms",
            product_mapping: {},
            input_mapping: null,
        }),
        submitCartSession: jest.fn().mockResolvedValue({ id: "s", success: true }),
    })),
}));

const options: SDKOptions = {
    organizationId: "org",
    checkoutCampaignId: "elina-campaign",
    features: { abandonedCart: true },
};

const tool = () => {
    const t: any = new AbandonedCartTool(options);
    t.campaign = { id: "elina-campaign", type: "elinapms" };
    return t;
};

describe("Elina PMS cart: stay dates from data attributes", () => {
    it("reads per-item ISO dates and nights", async () => {
        document.body.innerHTML = `
          <div class="shoppingCartItem align-centre" data-id="1" data-tagname="Fjellro"
               data-tagprice="7480,00" data-tagcategory="Hemsedal" data-accid="655"
               data-startdate="2027-01-19" data-enddate="2027-01-23" data-nights="4"></div>
          <input id="Total" value="8800,00" />`;
        const basket = await tool().fetchElinapmsBasket();
        expect(basket.total).toBe(8800);
        expect(basket.products[0]).toMatchObject({
            name: "Fjellro",
            price: 7480,
            startDate: "2027-01-19",
            endDate: "2027-01-23",
            nights: 4,
        });
    });

    it("falls back to the page-level stay block and computes nights", async () => {
        document.body.innerHTML = `
          <div class="stay" data-startdate="2026-12-27T00:00:00" data-enddate="2027-01-03"></div>
          <div class="shoppingCartItem align-centre" data-id="2" data-tagname="Solsiden" data-tagprice="12 000"></div>
          <div class="shoppingCartItem align-centre" data-id="3" data-tagname="Utsikten" data-tagprice="9000"></div>`;
        const basket = await tool().fetchElinapmsBasket();
        expect(basket.products.map((p: any) => [p.startDate, p.endDate, p.nights])).toEqual([
            ["2026-12-27", "2027-01-03", 7],
            ["2026-12-27", "2027-01-03", 7],
        ]);
    });

    it("leaves products without dates when no attributes exist or they are invalid", async () => {
        document.body.innerHTML = `
          <div class="shoppingCartItem align-centre" data-id="4" data-tagname="X" data-tagprice="1"
               data-startdate="27/12/2026" data-enddate="03/01/2027"></div>`;
        const basket = await tool().fetchElinapmsBasket();
        expect(basket.products[0].startDate).toBeUndefined();
        expect(basket.products[0].nights).toBeUndefined();
    });
});
