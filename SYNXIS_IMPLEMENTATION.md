# SynXis Abandoned Cart Integration — Implementation Instructions

## Overview

Add support for `type: "synxis"` campaigns to the existing `AbandonedCartTool` in `src/tools/abandoned-cart-tool.ts`. This follows the exact same pattern as the existing `"bookvisit"` type — but instead of calling an external API with a JWT token, we call the SBE's own internal cart API which is same-origin and cookie-authenticated.

## How the SynXis SBE works

The SynXis Booking Engine (by Sabre) is a webpack-bundled SPA hosted on the hotel's domain (e.g. `booking.frognerhouse.no`). When a user adds a room to their cart:

1. The SBE creates a reservation via its internal API
2. It sets two cookies: `shoppingCartId` (UUID) and `sbeSessionID` (session token)
3. It appends `sbe_rc` to the URL — a base64-encoded UUID that allows the booking to be resumed
4. It pushes reservation data into `window.dataLayer` (GTM data layer)

Our script is loaded via GTM, so it runs on the same origin with access to cookies and the SBE's APIs.

## Primary data source: Cart API

**Endpoint:** `GET /gw/v1/cart/{shoppingCartId}?businesscontext=BE`

- Same-origin (no CORS issues)
- Authenticated via cookies (`credentials: "include"`)
- Headers: `Content-Type: application/json`, `Accept: application/json`
- `shoppingCartId` comes from the cookie of the same name

### Cart API response shape

```json
{
  "ShoppingCart": [{
    "UpdatedData": {
      "itinerary": {
        "reservations": [{
          "id": "7770cdff-fb0e-4e15-9bed-17aa9b93d456",
          "chainId": 29298,
          "hotelId": 38020,
          "itineraryNumber": "29298B0051354",
          "confirmationNumber": "38020SG012256",
          "status": "Booked",
          "stayCriteria": {
            "roomCode": "O_BA53_SD",
            "rateCode": "BARNONREF",
            "startDate": "2026-04-23T00:00:00",
            "endDate": "2026-04-26T00:00:00"
          },
          "guestCriteria": {
            "numAdults": 1,
            "numChildren": 0
          },
          "extrasFromShopping": {
            "amount": 1345.67,
            "currencyCode": "NOK",
            "displayname": "Betal nå - Rabattert pris - Ikke refunderbar",
            "bedDescription": "Dobbeltseng",
            "bedType": "Double",
            "inventory": 28,
            "coverImage": "https://controlcenter-p1.synxis.com/...",
            "bookingPolicyCode": "DEPNONREF",
            "cancelPolicyCode": "CXLNONREF",
            "prices": {
              "Daily": [
                { "Date": "2026-04-23T00:00:00", "Price": { "Amount": 1329, "CurrencyCode": "NOK", "Tax": { "Amount": 0 }, "Fees": { "Amount": 0 }, "Total": { "Amount": 1329, "AmountWithTaxesFees": 1329 } }, "AvailableInventory": 33 },
                { "Date": "2026-04-24T00:00:00", "Price": { "Amount": 1489, "..." : "..." } },
                { "Date": "2026-04-25T00:00:00", "Price": { "Amount": 1219, "..." : "..." } }
              ],
              "Total": {
                "Price": { "Amount": 4037, "CurrencyCode": "NOK", "Tax": { "Amount": 0 }, "Fees": { "Amount": 0, "BreakDown": [] }, "Total": { "Amount": 4037, "AmountPayableNow": 4037, "AmountWithTaxesFees": 4037 } }
              }
            }
          },
          "addOns": []
        }]
      }
    }
  }]
}
```

## Fallback data source: window.dataLayer

If the cart API fails (no cookie, network error), fall back to reading `window.dataLayer`. The SBE pushes entries with `event: "checkout"` or `event: "app"` that contain a `Cart[]` array with per-room data:

```
Cart[0].RoomName = "Dobbeltstudio"
Cart[0].RoomCode = "O_BA53_SD"  
Cart[0].RateCode = "BARNONREF"
Cart[0].TotalCost = 4037
Cart[0].CurrCode = "NOK"
Cart[0].ArrivalDt = "2026-04-23"
Cart[0].DepartDt = "2026-04-26"
Cart[0].NightsQty = 3
...etc
```

## Session identifiers to capture as metadata

- `shoppingCartId` cookie — UUID for cart API
- `sbeSessionID` cookie — SBE session token (also in dataLayer as `sid`)
- `sbe_rc` URL param — base64-encoded UUID, decode with `atob()`

## Changes required

### 1. `initialize()` method

Find:
```typescript
if (campaign.type !== "bookvisit") {
    this.productDetector = new ProductDetector(campaign.product_mapping);
    this.totalExtractor = new TotalExtractor(campaign.total_selector);
}
```

Replace with:
```typescript
if (campaign.type !== "bookvisit" && campaign.type !== "synxis") {
    this.productDetector = new ProductDetector(campaign.product_mapping);
    this.totalExtractor = new TotalExtractor(campaign.total_selector);
}
```

### 2. `handleContentUpdate()` method — product/total fetching

Find:
```typescript
if (this.campaign?.type === "bookvisit") {
    const bookvisitData = await this.fetchBookVisitBasket();
    if (bookvisitData) {
        products = bookvisitData.products;
        total = bookvisitData.total;
    }
} else {
    products = this.productDetector?.detectProducts() || [];
    total = this.totalExtractor?.extractTotal() || this.totalAverage;
}
```

Replace with:
```typescript
if (this.campaign?.type === "bookvisit") {
    const bookvisitData = await this.fetchBookVisitBasket();
    if (bookvisitData) {
        products = bookvisitData.products;
        total = bookvisitData.total;
    }
} else if (this.campaign?.type === "synxis") {
    const synxisData = await this.fetchSynxisBasket();
    if (synxisData) {
        products = synxisData.products;
        total = synxisData.total;
    }
} else {
    products = this.productDetector?.detectProducts() || [];
    total = this.totalExtractor?.extractTotal() || this.totalAverage;
}
```

### 3. `handleContentUpdate()` method — payload

Find:
```typescript
const payload: CartSessionPayload = {
    organization_id: this.options.organizationId,
    checkout_campaign_id: this.options.checkoutCampaignId,
    content: content,
    products: products,
    url: currentUrl,
    total: total,
    id: effectiveSessionId,
};
```

Replace with:
```typescript
const payload: CartSessionPayload = {
    organization_id: this.options.organizationId,
    checkout_campaign_id: this.options.checkoutCampaignId,
    content: content,
    products: products,
    url: currentUrl,
    total: total,
    id: effectiveSessionId,
    ...(this.campaign?.type === "synxis" && (this as any)._synxisSessionIds
        ? { metadata: (this as any)._synxisSessionIds }
        : {}),
};
```

### 4. Add these 6 new private methods to the class

#### `fetchSynxisBasket()` — entry point

```typescript
private async fetchSynxisBasket(): Promise<{
    products: any[];
    total: number;
} | null> {
    if (!this.campaign || this.campaign.type !== "synxis") {
        return null;
    }

    const sessionIds = this.getSynxisSessionIds();
    if (sessionIds) {
        (this as any)._synxisSessionIds = sessionIds;
    }

    const cartResult = await this.fetchSynxisCartApi();
    if (cartResult) {
        return cartResult;
    }

    try {
        const dataLayer = this.getSynxisDataLayer();
        if (dataLayer && dataLayer.length > 0) {
            console.log("SynXis: Cart API unavailable, using dataLayer fallback");
            return this.extractSynxisProductsFromDataLayer(dataLayer);
        }
    } catch (error) {
        console.error("SynXis: dataLayer fallback failed:", error);
    }

    return null;
}
```

#### `fetchSynxisCartApi()` — calls the cart REST API

```typescript
private async fetchSynxisCartApi(): Promise<{
    products: any[];
    total: number;
} | null> {
    const cartId = this.getCookie("shoppingCartId");
    if (!cartId) {
        console.warn("SynXis: No shoppingCartId cookie found");
        return null;
    }

    try {
        const resp = await fetch(
            `/gw/v1/cart/${cartId}?businesscontext=BE`,
            {
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            }
        );

        if (!resp.ok) {
            console.error(`SynXis cart API error: ${resp.status} ${resp.statusText}`);
            return null;
        }

        const data = await resp.json();
        return this.extractSynxisCartApiData(data);
    } catch (error) {
        console.error("SynXis: Error fetching cart API:", error);
        return null;
    }
}
```

#### `extractSynxisCartApiData()` — parses cart API response

```typescript
private extractSynxisCartApiData(data: any): {
    products: any[];
    total: number;
} {
    const products: any[] = [];
    let total = 0;

    try {
        const shoppingCarts = data?.ShoppingCart || [];

        for (const cart of shoppingCarts) {
            const reservations =
                cart?.UpdatedData?.itinerary?.reservations || [];

            for (const resv of reservations) {
                const extras = resv.extrasFromShopping || {};
                const stay = resv.stayCriteria || {};
                const guests = resv.guestCriteria || {};
                const prices = extras.prices || {};

                const totalPrice =
                    prices?.Total?.Price?.Total?.AmountWithTaxesFees ||
                    prices?.Total?.Price?.Total?.Amount ||
                    prices?.Total?.Price?.Amount ||
                    0;

                const dailyPrices = (prices?.Daily || []).map((day: any) => ({
                    date: day.Date,
                    amount: day.Price?.Total?.Amount || day.Price?.Amount || 0,
                    amountWithTax: day.Price?.Total?.AmountWithTaxesFees || 0,
                    tax: day.Price?.Tax?.Amount || 0,
                    fees: day.Price?.Fees?.Amount || 0,
                    currency: day.Price?.CurrencyCode,
                    inventory: day.AvailableInventory,
                }));

                const product: any = {
                    id: resv.id,
                    confirmationNumber: resv.confirmationNumber,
                    itineraryNumber: resv.itineraryNumber,
                    name: extras.displayname || "Room",
                    roomCode: stay.roomCode,
                    rateCode: stay.rateCode,
                    price: totalPrice,
                    dailyRate: extras.amount || extras.amountWithTaxesFees,
                    currency: extras.currencyCode,
                    dailyPrices: dailyPrices,
                    taxes: prices?.Total?.Price?.Tax?.Amount || 0,
                    fees: prices?.Total?.Price?.Fees?.Amount || 0,
                    startDate: stay.startDate?.split("T")[0],
                    endDate: stay.endDate?.split("T")[0],
                    nights: dailyPrices.length || null,
                    adults: guests.numAdults || 1,
                    children: guests.numChildren || 0,
                    hotelId: String(resv.hotelId),
                    chainId: String(resv.chainId),
                    bedDescription: extras.bedDescription,
                    bedType: extras.bedType,
                    bedQuantity: extras.bedQuantity,
                    maxRoomSize: extras.maxRoomSize,
                    minRoomSize: extras.minRoomSize,
                    guestLimit: extras.guestLimit,
                    inventory: extras.inventory,
                    bookingPolicyCode: extras.bookingPolicyCode,
                    cancelPolicyCode: extras.cancelPolicyCode,
                    status: resv.status,
                    type: "room",
                    quantity: 1,
                    addons: resv.addOns || [],
                    image: extras.coverImage || extras.imageUrls?.[0]?.Path || null,
                };

                products.push(product);
                total += totalPrice;
            }
        }
    } catch (error) {
        console.error("SynXis: Error extracting cart API data:", error);
    }

    if (total === 0) {
        total = this.totalAverage || 0;
    }

    return { products, total };
}
```

#### `getSynxisSessionIds()` — reads cookies + URL param

```typescript
private getSynxisSessionIds(): {
    sbeSessionId: string | null;
    shoppingCartId: string | null;
    sbeRc: string | null;
    sbeRcDecoded: string | null;
} | null {
    const sbeSessionId = this.getCookie("sbeSessionID");
    const shoppingCartId = this.getCookie("shoppingCartId");

    let sbeRc: string | null = null;
    let sbeRcDecoded: string | null = null;
    if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        sbeRc = params.get("sbe_rc");
        if (sbeRc) {
            try {
                sbeRcDecoded = atob(sbeRc);
            } catch {
                // Invalid base64
            }
        }
    }

    if (!sbeSessionId && !shoppingCartId && !sbeRc) {
        return null;
    }

    return { sbeSessionId, shoppingCartId, sbeRc, sbeRcDecoded };
}
```

#### `getSynxisDataLayer()` — reads window.dataLayer (fallback)

```typescript
private getSynxisDataLayer(): any[] | null {
    if (typeof window === "undefined") {
        return null;
    }

    const dataLayer = (window as any).dataLayer;
    if (!Array.isArray(dataLayer)) {
        return null;
    }

    return dataLayer.filter((entry: any) => {
        return (
            entry.Cart ||
            entry.ecommerce?.checkout ||
            entry.ecommerce?.items ||
            entry.HName ||
            entry.HOTEL_ID ||
            entry.event === "checkout" ||
            entry.event === "checkoutLoad" ||
            entry.event === "app" ||
            entry.event === "purchase" ||
            entry.event === "confirmation" ||
            entry.event === "rooms.add" ||
            entry.TotalCost != null
        );
    });
}
```

#### `extractSynxisProductsFromDataLayer()` — parses dataLayer (fallback)

```typescript
private extractSynxisProductsFromDataLayer(dataLayerEntries: any[]): {
    products: any[];
    total: number;
} {
    const products: any[] = [];
    let total = 0;

    try {
        const main =
            dataLayerEntries.find((e) => e.event === "checkout") ||
            dataLayerEntries.find((e) => e.event === "purchase") ||
            dataLayerEntries.find((e) => e.event === "app" && e.Cart) ||
            dataLayerEntries.find((e) => e.Cart) ||
            dataLayerEntries.find((e) => e.event === "app") ||
            {};

        total =
            main.TotalCostWithTax ||
            main.TotalCost ||
            main.ItineraryPrice ||
            this.totalAverage ||
            0;

        const cart: any[] = main.Cart || [];
        if (cart.length > 0) {
            cart.forEach((item: any) => {
                products.push({
                    id: item.RoomCode || item.HOTEL_ID,
                    name: item.RoomName || "Room",
                    price: item.TotalCostWithTax || item.TotalCost || 0,
                    quantity: 1,
                    type: "room",
                    startDate: item.ArrivalDt,
                    endDate: item.DepartDt,
                    roomCode: item.RoomCode,
                    rateCode: item.RateCode,
                    rateName: item.RateName,
                    hotelName: item.HName,
                    hotelId: item.HOTEL_ID,
                    chainName: item.ChainNm,
                    chainId: item.CHAIN_ID,
                    nights: item.NightsQty,
                    adults: item.AdultQty,
                    children: item.ChildQty,
                    dailyRate: item.DailyRateWithTax || item.DailyRate,
                    currency: item.CurrCode,
                    taxes: item.Taxes || 0,
                    status: item.DetailedResvStatus || item.ResvStatus,
                });
            });
        } else if (main.RoomCode || main.RoomName) {
            products.push({
                id: main.RoomCode || main.HOTEL_ID,
                name: main.RoomName || "Room",
                price: total,
                quantity: 1,
                type: "room",
                startDate: main.ArrivalDt,
                endDate: main.DepartDt,
                roomCode: main.RoomCode,
                rateCode: main.RateCode,
                rateName: main.RateName,
                hotelName: main.HName,
                hotelId: main.HOTEL_ID,
                nights: main.NightsQty,
                adults: main.AdultQty,
                children: main.ChildQty,
                dailyRate: main.ItineraryDailyRate,
                currency: main.CurrCode,
                taxes: main.Taxes || 0,
            });
        }
    } catch (error) {
        console.error("SynXis: Error extracting dataLayer data:", error);
    }

    return { products, total };
}
```

### 5. Update types (if typed)

If `CartSessionPayload` doesn't have a `metadata` field, add it:

```typescript
interface CartSessionPayload {
    // ... existing fields ...
    metadata?: {
        sbeSessionId?: string | null;
        shoppingCartId?: string | null;
        sbeRc?: string | null;
        sbeRcDecoded?: string | null;
    };
}
```

If `CheckoutCampaign.type` is a union type, add `"synxis"`.

## Notes

- The `getCookie()` method already exists in the class from the BookVisit implementation — reuse it.
- No autofield injection needed — the SynXis checkout page has its own form fields (Fornavn, Etternavn, Mobiltelefon, E-postadresse) that the existing `InputDetector` can pick up via `input_mapping`.
- No iframe handling, no postMessage, no payment page field filling needed.
- The cart API is same-origin and uses the same cookies the SBE sets, so it works transparently.
