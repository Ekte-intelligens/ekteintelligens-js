// Tests cart restore end to end on a live BookVisit site from this PC, with
// nothing deployed. Run `npm run build` first (or use `npm run test:restore`).
//
//   npm run test:restore                  make a cart, then restore it
//   npm run test:restore reuse            restore the last captured cart
//   npm run test:restore old-price=6000   pretend the stored price was 6000
//   npm run test:restore promo=CODE       restore with our promo code
//   npm run test:restore hotel=highland
//
// Options are written without dashes because npm swallows `--flags` in
// PowerShell; `--reuse` style still works with `node scripts/restore-e2e.mjs`.
//
// Window 1 is the live site as-is (the live SDK's uploads are marked
// is_test). Make a cart and go to checkout; the BookVisit basket and any
// email/phone typed there are captured, so sites without an email field
// work too. Window 2 is a fresh browser profile, i.e. another device: it opens
// the restore link with this build injected, serves the captured cart in
// place of the get-checkout-session-restore edge function, and treats
// config.bookvisit.restore as true. Nothing is written to Supabase from
// window 2. BookVisit calls are real.

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { chromium } from "playwright-core";

class RestoreE2E {
    static ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
    static CART_FILE = resolve(RestoreE2E.ROOT, ".restore-test", "cart.json");
    static SETTLE_MS = 15000;
    static FORM_SETTLE_MS = 6000;

    static HOTELS = {
        bardola: {
            host: "booking.bardola.no",
            organizationId: "f93daffa-14cd-4f22-b99c-5845436c3a6c",
            checkoutCampaignId: "92a30d95-e543-49bb-b8d6-01f13a8f906c",
            channelId: "0d947d44-94e3-49ff-9cbf-36136fa6041a",
        },
        highland: {
            host: "booking.highland.no",
            organizationId: "d7481db7-f96d-4656-9d62-30e432af76a6",
            checkoutCampaignId: "74ec1191-222b-43a3-a2f8-3df0c2ba0fd1",
            channelId: "68b7ffe2-b904-4318-846d-cc34b43dc6dc",
        },
    };

    constructor(argv) {
        const flags = Object.fromEntries(
            argv.map((arg) => {
                const [key, value] = arg.replace(/^--/, "").split("=");
                return [key, value ?? true];
            }),
        );
        this.hotel = RestoreE2E.HOTELS[flags.hotel ?? "bardola"];
        if (!this.hotel) {
            throw new Error(`Unknown hotel. Known: ${Object.keys(RestoreE2E.HOTELS).join(", ")}`);
        }
        this.reuse = flags.reuse === true;
        this.promo = typeof flags.promo === "string" ? flags.promo : null;
        this.oldPrice = flags["old-price"] ? Number.parseInt(flags["old-price"], 10) : null;
        this.terminal = createInterface({ input: process.stdin, output: process.stdout });
    }

    async run() {
        const bundle = readFileSync(resolve(RestoreE2E.ROOT, "dist/index.js"), "utf8");
        if (!bundle.includes("getCartRestoreTool")) {
            throw new Error("dist/index.js has no cart restore. Run `npm run build` first.");
        }
        const browser = await chromium.launch({ channel: "chrome", headless: false });
        try {
            const cart = this.reuse ? this.loadCart() : await this.captureCart(browser);
            const page = await this.restoreOnNewDevice(browser, cart, bundle);
            if (process.stdin.isTTY) {
                await this.terminal.question("\nPress Enter to close the browser. ");
            } else {
                console.log("\nClose window 2 when you are done.");
                await page.waitForEvent("close", { timeout: 0 });
            }
        } finally {
            this.terminal.close();
            await browser.close();
        }
    }

    loadCart() {
        if (!existsSync(RestoreE2E.CART_FILE)) {
            throw new Error("No captured cart yet. Run without --reuse first.");
        }
        const cart = JSON.parse(readFileSync(RestoreE2E.CART_FILE, "utf8"));
        console.log(`Reusing cart ${cart.session_id} (${this.describe(cart.products)})`);
        return cart;
    }

    async captureCart(browser) {
        const context = await browser.newContext({ viewport: null });
        await context.addInitScript(() => localStorage.setItem("ei_test", "true"));
        const page = await context.newPage();
        // The live SDK's session id, when it uploads the cart (it only does
        // once an email or phone is typed, and not on every site).
        let sessionId = null;
        page.on("response", async (response) => {
            if (
                response.request().method() === "POST" &&
                response.url().includes("/functions/v1/cart-checkout-session")
            ) {
                sessionId = (await response.json().catch(() => null))?.id ?? sessionId;
            }
        });
        await page.goto(`https://${this.hotel.host}/en/accommodation`);

        console.log(
            "\nWindow 1: choose a room and go to checkout. Type an email and phone if the form has them.",
            `\nWindow 2 opens ${RestoreE2E.SETTLE_MS / 1000}s after the last change at checkout.`,
        );
        let snapshot = null;
        let lastChange = Date.now();
        for (;;) {
            await page.waitForTimeout(1000);
            const next = await page.evaluate(RestoreE2E.readCart, this.hotel.channelId).catch(() => null);
            if (!next) continue;
            const changed = JSON.stringify(next) !== JSON.stringify(snapshot);
            if (changed) {
                lastChange = Date.now();
                if (next.products.length > 0) {
                    console.log(
                        `Cart: ${this.describe(next.products)}`,
                        `| email ${next.email ?? "-"} | phone ${next.phone_country_code ?? ""} ${next.phone ?? "-"}`,
                    );
                }
            }
            snapshot = next;
            if (
                next.atCheckout &&
                next.products.length > 0 &&
                Date.now() - lastChange >= RestoreE2E.SETTLE_MS
            ) {
                break;
            }
        }
        const { atCheckout, ...captured } = snapshot;
        const cart = { session_id: sessionId ?? `e2e-session-${Date.now()}`, ...captured };
        mkdirSync(dirname(RestoreE2E.CART_FILE), { recursive: true });
        writeFileSync(RestoreE2E.CART_FILE, JSON.stringify(cart, null, 2));
        await context.close();
        return cart;
    }

    async restoreOnNewDevice(browser, cart, bundle) {
        const spec = {
            session_id: cart.session_id,
            products: cart.products.map((product) =>
                this.oldPrice === null ? product : { ...product, price: this.oldPrice },
            ),
            promo_code: this.promo,
            email: cart.email ?? null,
            phone: cart.phone ?? null,
            phone_country_code: cart.phone_country_code ?? null,
        };
        const context = await browser.newContext({ viewport: null });
        await context.addInitScript(RestoreE2E.pageScript, {
            spec,
            bundle,
            sdkOptions: {
                organizationId: this.hotel.organizationId,
                checkoutCampaignId: this.hotel.checkoutCampaignId,
                features: { cartRestore: true },
            },
        });
        const page = await context.newPage();
        page.on("console", (message) => {
            if (message.text().startsWith("[ei test]") || process.env.EI_DEBUG) {
                console.log(message.text());
            }
        });

        const link = `https://${this.hotel.host}/en/accommodation?s=e2e-${Date.now()}`;
        console.log(`\nWindow 2 (new device, no cookies): ${link}`);
        await page.goto(link);
        await page.waitForURL(/\/checkout/, { timeout: 20000 }).catch(() => {});
        await page.waitForLoadState("load");
        console.log(`Landed on ${page.url()}`);
        // BookVisit resets its form a moment after rendering it, so read the
        // fields once the form has settled.
        await page
            .waitForSelector('input[type="email"]', { timeout: 20000 })
            .catch(() => {});
        await page.waitForTimeout(RestoreE2E.FORM_SETTLE_MS);
        const fields = await page.evaluate(() =>
            Array.from(document.querySelectorAll('input[type="email"], input[type="tel"]'))
                .map((field) => `${field.name || field.id}=${field.value || "(empty)"}`)
                .join(", "),
        );
        console.log(`Contact fields after ${RestoreE2E.FORM_SETTLE_MS / 1000}s: ${fields || "none on the page"}`);
        const banner = await page
            .locator("[data-ei-restore-banner]")
            .first()
            .innerText({ timeout: 3000 })
            .catch(() => null);
        console.log(banner ? `Banner: ${banner.replace(/\s+/g, " ").trim()}` : "No banner shown.");

        // Read a few times: right after the checkout page loads the basket
        // call can still come back without rooms.
        let rooms = [];
        for (let attempt = 0; attempt < 5 && rooms.length === 0; attempt++) {
            if (attempt > 0) await page.waitForTimeout(1500);
            rooms = await page.evaluate(RestoreE2E.basketRooms, this.hotel.channelId).catch(() => []);
        }
        console.log(
            rooms.length
                ? `Basket now holds: ${this.describe(rooms)}`
                : "Basket is empty: nothing was restored.",
        );
        return page;
    }

    describe(products) {
        return products
            .map((p) => `${p.name ?? p.roomId ?? p.id} ${p.startDate?.slice(0, 10)} to ${p.endDate?.slice(0, 10)}, ${p.price ?? p.totalPrice}`)
            .join("; ");
    }

    // Runs in window 2 before the page's own scripts. An arrow function,
    // because Playwright injects it as source and method syntax doesn't parse.
    static pageScript = ({ spec, bundle, sdkOptions }) => {
        if (window.top !== window) return;
        const log = (...parts) => console.info("[ei test]", ...parts);
        const json = (body) =>
            new Response(JSON.stringify(body), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        const originalFetch = window.fetch.bind(window);
        window.fetch = async (input, init) => {
            const url = typeof input === "string" ? input : input.url;
            const body = String(init?.body ?? "");
            if (url.includes("/functions/v1/get-checkout-session-restore")) {
                log("restore spec served locally instead of the edge function");
                return json(spec);
            }
            if (url.includes("/functions/v1/create-event")) {
                if (body.includes('"cart_restore"')) log("restore event (not sent):", body);
                return json({ success: true });
            }
            if (url.includes("/functions/v1/cart-checkout-session")) {
                return json({ id: spec.session_id });
            }
            const response = await originalFetch(input, init);
            if (url.includes("/rest/v1/organizations_checkout_campaigns")) {
                const data = await response.clone().json().catch(() => null);
                for (const campaign of Array.isArray(data) ? data : data ? [data] : []) {
                    if (campaign?.config?.bookvisit) campaign.config.bookvisit.restore = true;
                }
                return data ? json(data) : response;
            }
            if (url.includes("restapi.bookvisit.com") && /search-v1|rooms\/add-v1/.test(url)) {
                log("BookVisit", init?.method ?? "GET", new URL(url).pathname, response.status);
            }
            return response;
        };

        document.addEventListener("DOMContentLoaded", async () => {
            try {
                const previous = window.EkteIntelligensSDK;
                (0, eval)(bundle);
                const SDK = window.EkteIntelligensSDK;
                if (previous === undefined) delete window.EkteIntelligensSDK;
                else window.EkteIntelligensSDK = previous;

                const sdk = new SDK(sdkOptions);
                await sdk.initialize();
                const outcome = sdk.getCartRestoreTool()?.getLastOutcome();
                if (outcome) log("outcome:", outcome);
            } catch (error) {
                log("test SDK failed:", String(error?.stack ?? error));
            }
        });
    };

    /**
     * Runs in window 1: the basket as products, built the way the SDK's
     * abandoned-cart tool builds them, plus what is typed at checkout.
     */
    static readCart = async (channelId) => {
        const value = (selector) => document.querySelector(selector)?.value?.trim() || null;
        const contact = {
            email: value('input[type="email"]'),
            phone:
                value('input[autocomplete="tel-national"]') ??
                value('input[type="tel"]:not([autocomplete="tel-country-code"])'),
            phone_country_code: value('input[autocomplete="tel-country-code"]'),
        };
        const atCheckout = /\/checkout/.test(location.pathname);
        const token = document.cookie.match(/(?:^|; )bv_jwt=([^;]+)/)?.[1];
        if (!token) return { atCheckout, products: [], ...contact };
        const response = await fetch(
            `https://restapi.bookvisit.com/baskets/basket-v1?channelId=${channelId}`,
            { headers: { Authorization: `Bearer ${decodeURIComponent(token)}` } },
        );
        const data = (await response.json().catch(() => null))?.booking?.bookingData;
        const products = (data?.rooms ?? []).map((room) => {
            const ratePlanId = room.priceInfo?.[0]?.ratePlanId ?? null;
            return {
                id: room.roomId,
                name: data.roomDescriptions?.find((d) => d.id === room.roomId)?.name ?? "Room",
                price: room.totalPrice ?? 0,
                quantity: 1,
                type: "room",
                startDate: room.startDate,
                endDate: room.endDate,
                roomConfig: room.roomConfig,
                ...(ratePlanId ? { ratePlanId } : {}),
                ratePlan: data.ratePlanDescriptions?.find((d) => d.id === ratePlanId)?.name,
            };
        });
        return { atCheckout, products, ...contact };
    };

    // Runs in window 2 after the restore.
    static async basketRooms(channelId) {
        const token = document.cookie.match(/(?:^|; )bv_jwt=([^;]+)/)?.[1];
        if (!token) return [];
        const response = await fetch(
            `https://restapi.bookvisit.com/baskets/basket-v1?channelId=${channelId}`,
            { headers: { Authorization: `Bearer ${decodeURIComponent(token)}` } },
        );
        const data = await response.json().catch(() => null);
        return (data?.booking?.bookingData?.rooms ?? []).map((room) => ({
            roomId: room.roomId,
            startDate: room.startDate,
            endDate: room.endDate,
            totalPrice: room.totalPrice,
        }));
    }
}

await new RestoreE2E(process.argv.slice(2)).run();
