import { SupabaseService } from "../services/supabase-service";
import { BookVisitClient } from "../services/bookvisit-client";
import { AbandonedCartTool } from "./abandoned-cart";
import { RestoreOverlay } from "../utils/restore-overlay";
import { RestoreMessages } from "../utils/restore-messages";
import { CheckoutPrefill } from "../utils/checkout-prefill";
import {
    BookVisitRoomConfig,
    BookVisitRoomProduct,
    BookVisitSearchHit,
    BookVisitSearchResult,
    CartRestoreNotice,
    CheckoutContact,
    CartRestoreOutcome,
    CartRestoreSpec,
    SDKOptions,
} from "../types";

type Stage = "spec" | "token" | "basket" | "search" | "add";

interface RestoreResult {
    outcome: CartRestoreOutcome;
    notices: CartRestoreNotice[];
    /** Set when rooms were added and the visitor should move on. */
    continueTo?: string;
    /** Filled into the checkout form on the page we continue to. */
    contact?: CheckoutContact;
}

interface MatchedRoom {
    room: BookVisitRoomProduct;
    hitKey: string;
    /** The search the hitKey came from. */
    resultId: string;
    plainPrice: number | null;
    promoPrice: number | null;
    currency: string | null;
}

/**
 * Rebuilds an expired BookVisit cart when the visitor returns through an
 * abandoned-cart link (`?s=<id_short_encoded>`).
 *
 * BookVisit's `bv_jwt` session expires after an hour, which empties the
 * basket. This tool reads the stored cart back, searches the same rooms and
 * rate plans for the same dates and guests, adds them to the new basket and
 * continues to checkout with the saved email and phone filled in. Price changes, a
 * promo code we issued, and rooms that are gone are reported in a banner.
 *
 * Runs once per `?s=` id per browser session, and only when both
 * `features.cartRestore` and the campaign's `config.bookvisit.restore` are on.
 */
export class CartRestoreTool {
    private static readonly URL_PARAM = "s";
    private static readonly ATTEMPTED_KEY = "ei_cart_restore_attempted_ids";
    private static readonly NOTICES_KEY = "ei_cart_restore_notices";
    private static readonly CONTACT_KEY = "ei_cart_restore_contact";
    private static readonly TIMEOUT_MS = 8000;
    private static readonly CONTINUE_PATH = "/checkout";
    private static readonly DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
    private static readonly LANGUAGE_PREFIX = /^\/[a-z]{2}(?=\/)/;

    private options: SDKOptions;
    private supabaseService: SupabaseService;
    private overlay = new RestoreOverlay();
    private controller?: AbortController;
    private isInitialized = false;
    private lastOutcome?: CartRestoreOutcome;
    private prefill = new CheckoutPrefill();

    constructor(options: SDKOptions) {
        this.options = options;
        this.supabaseService = new SupabaseService(
            options.supabaseUrl,
            options.supabaseAnonKey,
        );
    }

    async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            return true;
        }
        this.isInitialized = true;
        if (typeof window === "undefined") {
            return true;
        }

        this.showPendingNotices();
        this.fillPendingContact();

        const shortId = this.getShortId();
        if (!shortId || this.getAttemptedIds().includes(shortId)) {
            return true;
        }

        const channelId = await this.getRestoreChannelId();
        if (!channelId) {
            return true;
        }

        // Marked before running, so a reload mid-restore or a failed attempt
        // cannot loop.
        this.markAttempted(shortId);

        const outcome = await this.run(shortId, channelId);
        this.lastOutcome = outcome;
        void this.supabaseService.createAssistantEvent({
            id_short_encoded: shortId,
            type: "cart_restore",
            outcome,
        });
        return true;
    }

    public getLastOutcome(): CartRestoreOutcome | undefined {
        return this.lastOutcome;
    }

    public destroy(): void {
        this.controller?.abort();
        this.controller = undefined;
        this.prefill.destroy();
        this.overlay.destroy();
        this.isInitialized = false;
    }

    /** Full navigation, so BookVisit's app boots with the new basket. */
    protected navigate(url: string): void {
        window.location.assign(url);
    }

    private async getRestoreChannelId(): Promise<string | null> {
        if (this.options.features?.cartRestore !== true) {
            return null;
        }
        const campaign = await this.supabaseService.getCheckoutCampaign(
            this.options.checkoutCampaignId,
        );
        const bookvisit = campaign?.config?.bookvisit;
        if (campaign?.type !== "bookvisit" || bookvisit?.restore !== true) {
            return null;
        }
        return bookvisit.channel_id || null;
    }

    /**
     * Run the restore under one master timer. On expiry, or when the visitor
     * closes the overlay, every request is aborted and the overlay removed.
     */
    private async run(
        shortId: string,
        channelId: string,
    ): Promise<CartRestoreOutcome> {
        const controller = new AbortController();
        this.controller = controller;
        const stage: { current: Stage } = { current: "spec" };
        let timedOut = false;
        let continuing = false;

        this.overlay.showLoading(
            RestoreMessages.get("restoring"),
            RestoreMessages.get("close"),
            () => controller.abort(),
        );
        const timer = setTimeout(() => {
            timedOut = true;
            controller.abort();
            this.overlay.hideLoading();
        }, CartRestoreTool.TIMEOUT_MS);

        let notices: CartRestoreNotice[] = [];
        try {
            const result = await this.restore(
                shortId,
                channelId,
                controller.signal,
                stage,
            );
            notices = result.notices;
            if (result.continueTo) {
                this.storePendingNotices(notices);
                this.storePendingContact(result.contact);
                notices = [];
                continuing = true;
                this.navigate(result.continueTo);
            }
            return result.outcome;
        } catch (error) {
            if (!controller.signal.aborted) {
                console.error("Cart restore failed:", error);
                notices = [{ kind: "failed" }];
                return "failed";
            }
            if (!timedOut) {
                return "cancelled";
            }
            notices = [{ kind: "failed" }];
            return stage.current === "token" ? "no_token" : "timeout";
        } finally {
            // While navigating, the overlay stays up until the page unloads;
            // the master timer still removes it if the navigation stalls.
            if (!continuing) {
                clearTimeout(timer);
                this.overlay.hideLoading();
            }
            notices.forEach((notice) =>
                this.overlay.showBanner(
                    RestoreMessages.forNotice(notice),
                    RestoreMessages.get("close"),
                ),
            );
            if (this.controller === controller) {
                this.controller = undefined;
            }
        }
    }

    private async restore(
        shortId: string,
        channelId: string,
        signal: AbortSignal,
        stage: { current: Stage },
    ): Promise<RestoreResult> {
        const failed: RestoreResult = {
            outcome: "failed",
            notices: [{ kind: "failed" }],
        };

        stage.current = "spec";
        const spec = await this.abortable(
            this.supabaseService.getCartRestore(shortId),
            signal,
        );
        const rooms = spec ? this.getRestorableRooms(spec) : null;
        if (!spec || !rooms) {
            return { ...failed, outcome: "invalid_link" };
        }

        if (rooms.some((room) => room.startDate < this.today())) {
            return { outcome: "unavailable", notices: [{ kind: "unavailable" }] };
        }

        const client = new BookVisitClient(channelId);
        stage.current = "token";
        const token = await this.abortable(client.waitForToken(signal), signal);
        if (!token) {
            return { ...failed, outcome: "no_token" };
        }

        stage.current = "basket";
        const basket = await this.abortable(client.getBasket(signal), signal);
        if (!basket) {
            return failed;
        }
        if (BookVisitClient.basketHasRooms(basket)) {
            return { outcome: "basket_exists", notices: [] };
        }

        // Keep uploading to the original cart session, so restoring on a new
        // device does not start a second session (and a second email).
        AbandonedCartTool.saveSessionIdToStorage(spec.session_id);

        stage.current = "search";
        const promoCode = spec.promo_code?.trim() || undefined;
        const matched: MatchedRoom[] = [];
        for (const group of this.groupByStay(rooms)) {
            const request = {
                startDate: group[0].startDate,
                endDate: group[0].endDate,
                roomConfigs: group.map((room) => this.toRoomConfig(room)),
            };
            const [plain, promo] = await this.abortable(
                Promise.all([
                    client.search(request, signal),
                    promoCode
                        ? client.search({ ...request, promoCode }, signal)
                        : Promise.resolve(null),
                ]),
                signal,
            );
            if (!plain) {
                return failed;
            }
            const groupMatches = this.matchRooms(group, plain, promo);
            if (!groupMatches) {
                return { outcome: "unavailable", notices: [{ kind: "unavailable" }] };
            }
            matched.push(...groupMatches);
        }

        stage.current = "add";
        for (const [index, match] of matched.entries()) {
            const added = await this.abortable(
                client.addRoom(match.hitKey, match.resultId, index > 0, signal),
                signal,
            );
            if (!added) {
                return failed;
            }
        }

        const notices = this.buildNotices(matched, promoCode);
        return {
            outcome: notices.some((notice) => notice.kind === "priceChanged")
                ? "restored_price_changed"
                : "restored",
            notices,
            continueTo: this.continueUrl(),
            contact:
                CheckoutPrefill.clean(spec.email, spec.phone, spec.phone_country_code) ??
                undefined,
        };
    }

    /**
     * The rooms of a stored cart, or null when any of them cannot be
     * searched again. Add-ons are not restored.
     */
    private getRestorableRooms(spec: CartRestoreSpec): BookVisitRoomProduct[] | null {
        const rooms = spec.products.filter((product) => product?.type === "room");
        if (rooms.length === 0) {
            return null;
        }
        const valid = rooms.every(
            (room) =>
                typeof room.id === "string" &&
                room.id.length > 0 &&
                CartRestoreTool.DATE_PATTERN.test(room.startDate ?? "") &&
                CartRestoreTool.DATE_PATTERN.test(room.endDate ?? "") &&
                room.endDate > room.startDate &&
                Number.isInteger(room.roomConfig?.adults) &&
                room.roomConfig.adults > 0,
        );
        return valid ? (rooms as BookVisitRoomProduct[]) : null;
    }

    private groupByStay(rooms: BookVisitRoomProduct[]): BookVisitRoomProduct[][] {
        const groups = new Map<string, BookVisitRoomProduct[]>();
        for (const room of rooms) {
            const key = `${room.startDate}|${room.endDate}`;
            groups.set(key, [...(groups.get(key) ?? []), room]);
        }
        return Array.from(groups.values());
    }

    /** search-v1 takes `childAges: []`, never null, and no other fields. */
    private toRoomConfig(room: BookVisitRoomProduct): BookVisitRoomConfig {
        const childAges = room.roomConfig?.childAges;
        return {
            adults: room.roomConfig?.adults ?? 1,
            childAges: Array.isArray(childAges)
                ? childAges.filter((age) => Number.isInteger(age))
                : [],
        };
    }

    /**
     * Find each room's rate in the search results: same room and rate plan
     * (by id, or by name for carts saved before rate plan ids were stored).
     * Null when any room has no match; a different rate is never picked.
     */
    private matchRooms(
        rooms: BookVisitRoomProduct[],
        plainSearch: BookVisitSearchResult,
        promoSearch: BookVisitSearchResult | null,
    ): MatchedRoom[] | null {
        const usedPlain = new Set<string>();
        const usedPromo = new Set<string>();
        const matches: MatchedRoom[] = [];
        for (const room of rooms) {
            const plain = this.findHit(plainSearch.hits, room, usedPlain);
            if (!plain) {
                return null;
            }
            usedPlain.add(plain.hitKey);
            const promo = promoSearch
                ? this.findHit(promoSearch.hits, room, usedPromo)
                : null;
            if (promo) {
                usedPromo.add(promo.hitKey);
            }
            matches.push({
                room,
                hitKey: promo?.hitKey ?? plain.hitKey,
                resultId: promo && promoSearch ? promoSearch.resultId : plainSearch.resultId,
                plainPrice: plain.price,
                promoPrice: promo?.price ?? null,
                currency: plain.currency ?? promo?.currency ?? null,
            });
        }
        return matches;
    }

    /**
     * Each searched room config gets its own hitKey per rate, in no
     * particular order, so hits are matched to rooms on their guests.
     */
    private findHit(
        hits: BookVisitSearchHit[],
        room: BookVisitRoomProduct,
        used: Set<string>,
    ): BookVisitSearchHit | null {
        const storedName = room.ratePlan?.trim().toLowerCase();
        const guests = this.toRoomConfig(room);
        return (
            hits.find((hit) => {
                if (used.has(hit.hitKey) || hit.roomId !== room.id) {
                    return false;
                }
                if (hit.roomConfig && !this.sameGuests(hit.roomConfig, guests)) {
                    return false;
                }
                if (room.ratePlanId) {
                    return hit.ratePlanId === room.ratePlanId;
                }
                return (
                    !!storedName &&
                    hit.ratePlanName?.trim().toLowerCase() === storedName
                );
            }) ?? null
        );
    }

    private sameGuests(a: BookVisitRoomConfig, b: BookVisitRoomConfig): boolean {
        const ages = (config: BookVisitRoomConfig) =>
            [...config.childAges].sort((x, y) => x - y).join(",");
        return a.adults === b.adults && ages(a) === ages(b);
    }

    private buildNotices(
        matched: MatchedRoom[],
        promoCode: string | undefined,
    ): CartRestoreNotice[] {
        const notices: CartRestoreNotice[] = [];
        const currency = matched.find((match) => match.currency)?.currency ?? null;

        if (matched.every((match) => match.plainPrice !== null)) {
            const oldPrice = matched.reduce(
                (sum, match) => sum + Math.round(match.room.price),
                0,
            );
            const newPrice = matched.reduce(
                (sum, match) => sum + (match.plainPrice as number),
                0,
            );
            if (oldPrice !== newPrice) {
                notices.push({ kind: "priceChanged", oldPrice, newPrice, currency });
            }
        }

        if (promoCode) {
            const savings = matched.reduce(
                (sum, match) =>
                    match.plainPrice !== null &&
                    match.promoPrice !== null &&
                    match.promoPrice < match.plainPrice
                        ? sum + (match.plainPrice - match.promoPrice)
                        : sum,
                0,
            );
            if (savings > 0) {
                notices.push({ kind: "promoApplied", promoCode, savings, currency });
            }
        }
        return notices;
    }

    /**
     * Checkout page on this site, keeping the language prefix (`/no/…`) and
     * every query param except `s`.
     */
    private continueUrl(): string {
        const params = new URLSearchParams(window.location.search);
        params.delete(CartRestoreTool.URL_PARAM);
        const query = params.toString();
        const language =
            CartRestoreTool.LANGUAGE_PREFIX.exec(window.location.pathname)?.[0] ?? "";
        return `${language}${CartRestoreTool.CONTINUE_PATH}${query ? `?${query}` : ""}`;
    }

    private abortable<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (signal.aborted) {
                reject(new Error("Cart restore aborted"));
                return;
            }
            const onAbort = () => reject(new Error("Cart restore aborted"));
            signal.addEventListener("abort", onAbort, { once: true });
            work.then(resolve, reject).finally(() =>
                signal.removeEventListener("abort", onAbort),
            );
        });
    }

    private today(): string {
        const now = new Date();
        const pad = (value: number) => String(value).padStart(2, "0");
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    }

    private getShortId(): string | null {
        try {
            const value = new URLSearchParams(window.location.search).get(
                CartRestoreTool.URL_PARAM,
            );
            return value && value.trim() ? value.trim() : null;
        } catch {
            return null;
        }
    }

    private getAttemptedIds(): string[] {
        try {
            const parsed = JSON.parse(
                sessionStorage.getItem(CartRestoreTool.ATTEMPTED_KEY) ?? "[]",
            );
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    private markAttempted(shortId: string): void {
        try {
            sessionStorage.setItem(
                CartRestoreTool.ATTEMPTED_KEY,
                JSON.stringify([...this.getAttemptedIds(), shortId]),
            );
        } catch (error) {
            console.warn("Failed to persist cart restore attempt:", error);
        }
    }

    /** Notices for the page we navigate to, shown once it loads. */
    private storePendingNotices(notices: CartRestoreNotice[]): void {
        if (notices.length === 0) {
            return;
        }
        try {
            sessionStorage.setItem(
                CartRestoreTool.NOTICES_KEY,
                JSON.stringify(notices),
            );
        } catch (error) {
            console.warn("Failed to persist cart restore notices:", error);
        }
    }

    private storePendingContact(contact: CheckoutContact | undefined): void {
        if (!contact) {
            return;
        }
        try {
            sessionStorage.setItem(CartRestoreTool.CONTACT_KEY, JSON.stringify(contact));
        } catch (error) {
            console.warn("Failed to persist cart restore contact:", error);
        }
    }

    /** Fill the contact saved by a restore into the checkout form. */
    private fillPendingContact(): void {
        let stored: string | null = null;
        try {
            stored = sessionStorage.getItem(CartRestoreTool.CONTACT_KEY);
            sessionStorage.removeItem(CartRestoreTool.CONTACT_KEY);
        } catch {
            return;
        }
        let parsed: Partial<CheckoutContact> | null = null;
        try {
            parsed = stored ? JSON.parse(stored) : null;
        } catch {
            return;
        }
        const contact = parsed
            ? CheckoutPrefill.clean(parsed.email, parsed.phone, parsed.phoneCountryCode)
            : null;
        if (contact) {
            this.prefill.fill(contact);
        }
    }

    private showPendingNotices(): void {
        let notices: CartRestoreNotice[] = [];
        try {
            const stored = sessionStorage.getItem(CartRestoreTool.NOTICES_KEY);
            sessionStorage.removeItem(CartRestoreTool.NOTICES_KEY);
            const parsed = stored ? JSON.parse(stored) : [];
            notices = Array.isArray(parsed) ? parsed : [];
        } catch {
            return;
        }
        notices.forEach((notice) =>
            this.overlay.showBanner(
                RestoreMessages.forNotice(notice),
                RestoreMessages.get("close"),
            ),
        );
    }
}
