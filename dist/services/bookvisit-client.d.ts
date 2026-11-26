import { BookVisitSearchRequest, BookVisitSearchResult } from '../types';

/**
 * Calls the BookVisit REST API on behalf of the visitor, with the `bv_jwt`
 * session token BookVisit's own booking engine keeps in a cookie. Request
 * and response shapes follow what booking.bardola.no sends.
 *
 * Every call takes an optional AbortSignal and resolves to null / false on
 * any failure instead of throwing.
 */
export declare class BookVisitClient {
    private readonly channelId;
    private static readonly API_BASE;
    private static readonly BASKET_PATH;
    private static readonly SEARCH_PATH;
    private static readonly ADD_ROOM_PATH;
    private static readonly TOKEN_COOKIE;
    private static readonly TOKEN_POLL_MS;
    private static readonly SEARCH_FILTER;
    constructor(channelId: string);
    getToken(): string | null;
    /**
     * BookVisit issues a fresh token shortly after its app boots, so on a
     * restore link the cookie may not exist yet. Resolves null on abort.
     */
    waitForToken(signal: AbortSignal): Promise<string | null>;
    getBasket(signal?: AbortSignal): Promise<any | null>;
    static basketHasRooms(basket: any): boolean;
    search(request: BookVisitSearchRequest, signal?: AbortSignal): Promise<BookVisitSearchResult | null>;
    /**
     * Add one searched room to the basket. The first room of a basket is
     * added with `useExistingBasket: false`, which creates the basket.
     */
    addRoom(hitKey: string, resultId: string, useExistingBasket: boolean, signal?: AbortSignal): Promise<boolean>;
    private request;
    /**
     * One entry per bookable `hitKey`: `roomsResult[].rateAlternatives[]
     * .ratesPerRoomConfig[]`. Member-only rates (`isLocked`) and packages
     * are left out, since the visitor cannot book them as a plain room.
     */
    private parseSearchHits;
    private amount;
    private roomConfig;
    private text;
}
//# sourceMappingURL=bookvisit-client.d.ts.map