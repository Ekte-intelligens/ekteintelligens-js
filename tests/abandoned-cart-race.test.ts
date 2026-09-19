import { AbandonedCartTool } from "../src/tools/abandoned-cart";
import { SDKOptions } from "../src/types";

// Records every submitted payload (deep-copied at call time) and answers like
// the edge function: reuse the id when given, otherwise create a new row.
// (`mock` prefix: jest only lets a hoisted mock factory close over such names.)
const mockSubmitted: any[] = [];
const mockState = { insertedRows: 0, submitDelay: 60 };

jest.mock("../src/services/supabase-service", () => ({
    SupabaseService: jest.fn().mockImplementation(() => ({
        getCheckoutCampaign: jest.fn().mockImplementation(async () => ({
            id: "test-campaign-id",
            type: (global as any).__campaignType,
            average_checkout_value: 0,
            config: { bookvisit: { channel_id: "channel" } },
            input_mapping: null,
            product_mapping: null,
            total_selector: null,
        })),
        submitCartSession: jest.fn().mockImplementation(async (payload) => {
            mockSubmitted.push(JSON.parse(JSON.stringify(payload)));
            await new Promise((resolve) =>
                setTimeout(resolve, mockState.submitDelay),
            );
            return { id: payload.id || `session-${++mockState.insertedRows}` };
        }),
    })),
}));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("AbandonedCartTool concurrent updates", () => {
    const options: SDKOptions = {
        organizationId: "test-org-id",
        checkoutCampaignId: "test-campaign-id",
        features: { abandonedCart: true },
    };

    const blur = (name: string, value: string) => {
        const input = document.querySelector(
            `[name="${name}"]`,
        ) as HTMLInputElement;
        input.value = value;
        input.dispatchEvent(new Event("blur"));
    };

    beforeEach(() => {
        mockSubmitted.length = 0;
        mockState.insertedRows = 0;
        mockState.submitDelay = 60;
        localStorage.clear();
        document.body.innerHTML = `
      <input name="email" />
      <input name="first_name" />
    `;
    });

    it("creates one session when a blur lands during the basket fetch", async () => {
        // BookVisit fetches the basket over the network before submitting.
        // The lock used to be taken only after that fetch, so a second update
        // starting meanwhile also submitted without a session id.
        (global as any).__campaignType = "bookvisit";
        document.cookie = "bv_jwt=token";
        (global as any).fetch = jest.fn().mockImplementation(async () => {
            await sleep(500);
            return {
                ok: true,
                json: async () => ({
                    booking: { bookingData: { totalPrice: 1000, rooms: [] } },
                }),
            };
        });
        mockState.submitDelay = 700; // slow edge function (cold start)

        const tool = new AbandonedCartTool(options);
        await tool.initialize();

        blur("email", "test@example.com");
        await sleep(450); // debounce fired, basket fetch in flight
        blur("first_name", "Kari");
        await sleep(2500);

        expect(mockSubmitted.filter((payload) => !payload.id)).toHaveLength(1);
        expect(
            mockSubmitted
                .slice(1)
                .every((payload) => payload.id === "session-1"),
        ).toBe(true);
        expect(
            mockSubmitted.some(
                (payload) => payload.content.first_name === "Kari",
            ),
        ).toBe(true);

        tool.destroy();
    }, 10000);

    it("uploads a field that was blurred while a request was in flight", async () => {
        (global as any).__campaignType = null;

        const tool = new AbandonedCartTool(options);
        await tool.initialize();

        blur("email", "test@example.com");
        await sleep(320); // first submit now in flight
        blur("first_name", "Ola");
        await sleep(1500);

        expect(mockSubmitted.filter((payload) => !payload.id)).toHaveLength(1);
        expect(
            mockSubmitted.some(
                (payload) => payload.content.first_name === "Ola",
            ),
        ).toBe(true);

        tool.destroy();
    }, 10000);
});
