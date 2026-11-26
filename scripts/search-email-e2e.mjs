// Opens a live BookVisit site in Chrome with this build of the SDK injected
// on every page load, with only the search box email field enabled. Run
// `npm run build` first (or use `npm run test:search-email`).
//
//   npm run test:search-email
//   npm run test:search-email hotel=highland
//
// config.bookvisit.search_email is treated as true; nothing else about the
// campaign changes. The site's own SDK still runs (its uploads are marked
// is_test). Type an email in the search box, book a room and the terminal
// shows what lands in the checkout email field.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

class SearchEmailE2E {
    static ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

    static HOTELS = {
        bardola: {
            host: "booking.bardola.no",
            organizationId: "f93daffa-14cd-4f22-b99c-5845436c3a6c",
            checkoutCampaignId: "92a30d95-e543-49bb-b8d6-01f13a8f906c",
        },
        highland: {
            host: "booking.highland.no",
            organizationId: "d7481db7-f96d-4656-9d62-30e432af76a6",
            checkoutCampaignId: "74ec1191-222b-43a3-a2f8-3df0c2ba0fd1",
        },
    };

    constructor(argv) {
        const flags = Object.fromEntries(
            argv.map((arg) => {
                const [key, value] = arg.replace(/^--/, "").split("=");
                return [key, value ?? true];
            }),
        );
        this.hotel = SearchEmailE2E.HOTELS[flags.hotel ?? "bardola"];
        if (!this.hotel) {
            throw new Error(`Unknown hotel. Known: ${Object.keys(SearchEmailE2E.HOTELS).join(", ")}`);
        }
    }

    async run() {
        const bundle = readFileSync(resolve(SearchEmailE2E.ROOT, "dist/index.js"), "utf8");
        if (!bundle.includes("getSearchEmailTool")) {
            throw new Error("dist/index.js has no search email field. Run `npm run build` first.");
        }
        const browser = await chromium.launch({ channel: "chrome", headless: false });
        const context = await browser.newContext({ viewport: null });
        await context.addInitScript(SearchEmailE2E.pageScript, {
            bundle,
            sdkOptions: {
                organizationId: this.hotel.organizationId,
                checkoutCampaignId: this.hotel.checkoutCampaignId,
                features: { searchEmail: true },
            },
        });
        const page = await context.newPage();
        page.on("console", (message) => {
            if (message.text().startsWith("[ei test]")) console.log(message.text());
        });
        const url = `https://${this.hotel.host}/no/accommodation`;
        console.log(`Opening ${url}\nClose the browser window when you are done.`);
        await page.goto(url);
        await page.waitForEvent("close", { timeout: 0 });
        await browser.close();
    }

    // Runs in the page before its own scripts. An arrow function, because
    // Playwright injects it as source and method syntax doesn't parse.
    static pageScript = ({ bundle, sdkOptions }) => {
        if (window.top !== window) return;
        const log = (...parts) => console.info("[ei test]", ...parts);
        localStorage.setItem("ei_test", "true");

        const originalFetch = window.fetch.bind(window);
        window.fetch = async (input, init) => {
            const url = typeof input === "string" ? input : input.url;
            const response = await originalFetch(input, init);
            if (url.includes("/rest/v1/organizations_checkout_campaigns")) {
                const data = await response.clone().json().catch(() => null);
                for (const campaign of Array.isArray(data) ? data : data ? [data] : []) {
                    if (campaign?.config?.bookvisit) campaign.config.bookvisit.search_email = true;
                }
                return data
                    ? new Response(JSON.stringify(data), {
                          status: 200,
                          headers: { "content-type": "application/json" },
                      })
                    : response;
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
                log(`test SDK running on ${location.pathname}, stored email: ${sessionStorage.getItem("ei_search_email") ?? "-"}`);
            } catch (error) {
                log("test SDK failed:", String(error?.stack ?? error));
            }

            let lastReport = "";
            setInterval(() => {
                const stored = sessionStorage.getItem("ei_search_email") ?? "-";
                const checkout = /\/checkout(\/|$)/.test(location.pathname)
                    ? document.querySelector('input[type="email"]')?.value || "(empty)"
                    : null;
                const report = checkout === null
                    ? `stored email: ${stored}`
                    : `stored email: ${stored} | checkout email field: ${checkout}`;
                if (report !== lastReport) {
                    lastReport = report;
                    log(report);
                }
            }, 1000);
        });
    };
}

await new SearchEmailE2E(process.argv.slice(2)).run();
