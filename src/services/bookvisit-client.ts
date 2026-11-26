import {
    BookVisitRoomConfig,
    BookVisitSearchHit,
    BookVisitSearchRequest,
    BookVisitSearchResult,
} from "../types";

/**
 * Calls the BookVisit REST API on behalf of the visitor, with the `bv_jwt`
 * session token BookVisit's own booking engine keeps in a cookie. Request
 * and response shapes follow what booking.bardola.no sends.
 *
 * Every call takes an optional AbortSignal and resolves to null / false on
 * any failure instead of throwing.
 */
export class BookVisitClient {
    private static readonly API_BASE = "https://restapi.bookvisit.com";
    private static readonly BASKET_PATH = "/baskets/basket-v1";
    private static readonly SEARCH_PATH = "/accommodation/search-v1";
    private static readonly ADD_ROOM_PATH = "/baskets/rooms/add-v1";
    private static readonly TOKEN_COOKIE = "bv_jwt";
    private static readonly TOKEN_POLL_MS = 200;
    private static readonly SEARCH_FILTER = {
        roomContent: "Full",
        packageContent: "Full",
        addOnContent: "Full",
        includeFullyBooked: false,
        includeRooms: true,
        includePackages: false,
        includeSearchResultAlerts: true,
    };

    constructor(private readonly channelId: string) {}

    public getToken(): string | null {
        if (typeof document === "undefined") {
            return null;
        }
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${BookVisitClient.TOKEN_COOKIE}=`);
        if (parts.length === 2) {
            return parts.pop()?.split(";").shift() || null;
        }
        return null;
    }

    /**
     * BookVisit issues a fresh token shortly after its app boots, so on a
     * restore link the cookie may not exist yet. Resolves null on abort.
     */
    public waitForToken(signal: AbortSignal): Promise<string | null> {
        return new Promise((resolve) => {
            const check = () => {
                if (signal.aborted) {
                    resolve(null);
                    return;
                }
                const token = this.getToken();
                if (token) {
                    resolve(token);
                    return;
                }
                setTimeout(check, BookVisitClient.TOKEN_POLL_MS);
            };
            check();
        });
    }

    public async getBasket(signal?: AbortSignal): Promise<any | null> {
        return this.request(
            `${BookVisitClient.BASKET_PATH}?IncludePaymentHistory=false&ChannelId=${encodeURIComponent(this.channelId)}`,
            { method: "GET" },
            signal,
        );
    }

    public static basketHasRooms(basket: any): boolean {
        const rooms = basket?.booking?.bookingData?.rooms;
        return Array.isArray(rooms) && rooms.length > 0;
    }

    public async search(
        request: BookVisitSearchRequest,
        signal?: AbortSignal,
    ): Promise<BookVisitSearchResult | null> {
        const data = await this.request(
            BookVisitClient.SEARCH_PATH,
            {
                method: "POST",
                body: JSON.stringify({
                    startDate: request.startDate,
                    endDate: request.endDate,
                    roomConfigs: request.roomConfigs,
                    filter: {
                        ...BookVisitClient.SEARCH_FILTER,
                        ...(request.promoCode
                            ? { promoCode: request.promoCode }
                            : {}),
                    },
                    channelId: this.channelId,
                }),
            },
            signal,
        );
        const resultId = this.text(data?.resultId);
        if (!data || !resultId) {
            return null;
        }
        return { resultId, hits: this.parseSearchHits(data) };
    }

    /**
     * Add one searched room to the basket. The first room of a basket is
     * added with `useExistingBasket: false`, which creates the basket.
     */
    public async addRoom(
        hitKey: string,
        resultId: string,
        useExistingBasket: boolean,
        signal?: AbortSignal,
    ): Promise<boolean> {
        const data = await this.request(
            BookVisitClient.ADD_ROOM_PATH,
            {
                method: "PATCH",
                body: JSON.stringify({
                    hitkey: hitKey,
                    nrOfUnits: 1,
                    resultId,
                    useExistingBasket,
                    channelId: this.channelId,
                }),
            },
            signal,
        );
        if (data?.success !== true) {
            if (data) {
                console.error("BookVisit could not add room:", data.errorString);
            }
            return false;
        }
        return true;
    }

    private async request(
        path: string,
        init: RequestInit,
        signal?: AbortSignal,
    ): Promise<any | null> {
        const token = this.getToken();
        if (!token) {
            console.warn("BookVisit JWT token not found in cookies");
            return null;
        }
        try {
            const response = await fetch(`${BookVisitClient.API_BASE}${path}`, {
                ...init,
                credentials: "include",
                signal,
                headers: {
                    authorization: `Bearer ${token}`,
                    ...(init.body ? { "content-type": "application/json" } : {}),
                },
            });
            if (!response.ok) {
                console.error(
                    `BookVisit API error: ${response.status} ${response.statusText}`,
                );
                return null;
            }
            return await response.json();
        } catch (error) {
            if (!signal?.aborted) {
                console.error(`BookVisit request to ${path} failed:`, error);
            }
            return null;
        }
    }

    /**
     * One entry per bookable `hitKey`: `roomsResult[].rateAlternatives[]
     * .ratesPerRoomConfig[]`. Member-only rates (`isLocked`) and packages
     * are left out, since the visitor cannot book them as a plain room.
     */
    private parseSearchHits(data: any): BookVisitSearchHit[] {
        const names = new Map<string, string>();
        for (const entry of Array.isArray(data?.ratePlanContent) ? data.ratePlanContent : []) {
            const id = this.text(entry?.ratePlanId ?? entry?.id);
            const name = this.text(entry?.name);
            if (id && name) names.set(id, name);
        }

        const hits: BookVisitSearchHit[] = [];
        for (const room of Array.isArray(data?.roomsResult) ? data.roomsResult : []) {
            const roomId = this.text(room?.roomId);
            if (!roomId || room?.isPackage) continue;
            for (const rate of Array.isArray(room.rateAlternatives) ? room.rateAlternatives : []) {
                if (rate?.packageId) continue;
                const ratePlanId = this.text(rate?.rateplanId ?? rate?.ratePlanId);
                const ratePlanName =
                    (ratePlanId ? names.get(ratePlanId) : undefined) ??
                    this.text(rate?.displayName);
                const currency = this.text(rate?.currency) ?? this.text(data?.currencyCode);
                for (const entry of Array.isArray(rate.ratesPerRoomConfig) ? rate.ratesPerRoomConfig : []) {
                    const hitKey = this.text(entry?.hitKey);
                    if (!hitKey || entry?.isLocked === true) continue;
                    hits.push({
                        hitKey,
                        roomId,
                        ratePlanId,
                        ratePlanName,
                        price: this.amount(entry?.totalPrice),
                        currency,
                        roomConfig: this.roomConfig(entry?.roomConfig),
                    });
                }
            }
        }
        return hits;
    }

    private amount(price: any): number | null {
        const value = price?.priceInclVAT ?? price?.displayPrice;
        return typeof value === "number" && isFinite(value) ? Math.round(value) : null;
    }

    private roomConfig(config: any): BookVisitRoomConfig | null {
        if (!config || !Number.isInteger(config.adults)) {
            return null;
        }
        return {
            adults: config.adults,
            childAges: Array.isArray(config.childAges) ? config.childAges : [],
        };
    }

    private text(value: unknown): string | null {
        if (typeof value === "string" && value.trim()) return value.trim();
        if (typeof value === "number" && isFinite(value)) return String(value);
        return null;
    }
}
