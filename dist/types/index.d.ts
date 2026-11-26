export interface SDKOptions {
    organizationId: string;
    checkoutCampaignId: string;
    pipelineCampaignId?: string;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    features?: {
        abandonedCart?: boolean;
        organizationPipeline?: boolean;
        enhancedInsights?: boolean;
        /**
         * Remember the check-in / check-out dates a visitor searched for
         * (listing-page URL params such as `from`/`to`, `start`/`end`,
         * `checkin`/`checkout`) and attach them to cart sessions whose
         * products carry no dates, plus `ei_stay` in the analytics payload.
         * Defaults to true. Persistence follows the analytics consent gate.
         */
        stayCapture?: boolean;
        /**
         * BookVisit: when a visitor arrives from an abandoned-cart link
         * (`?s=`) and their BookVisit session has expired, rebuild the cart
         * from the stored session and continue to add-ons. Also needs
         * `config.bookvisit.restore: true` on the checkout campaign.
         */
        cartRestore?: boolean;
    };
    config?: {
        completedCheckout?: boolean;
    };
    /**
     * Parent domain for the cross-subdomain `ei_analytics` cookie, e.g.
     * ".site.com". When omitted, the widest domain the browser accepts a
     * cookie on is probed automatically.
     */
    cookieDomain?: string;
    /**
     * When true, analytics is held in memory and nothing is persisted
     * (sessionStorage/cookie) or attached to uploads until consent is granted
     * via sdk.setConsent(true) or an auto-detected CMP (Cookiebot, OneTrust,
     * TCF). Defaults to false: persist immediately.
     */
    requireConsent?: boolean;
    /**
     * When true, enhanced-insights page history is also shared across
     * subdomains: a compact per-origin summary (scalars + dwell-capped
     * time_per_page, never raw visits) is kept in the `ei_insights` cookie,
     * and uploads merge the other origins' summaries into this origin's
     * history. Defaults to TRUE — a visitor who browses site.com and then
     * converts on booking.site.com should arrive with the history they
     * actually have. Set explicitly to false to keep insights per-origin.
     */
    shareInsightsAcrossSubdomains?: boolean;
}
export interface InputMapping {
    form_selector?: string;
    inputs?: string[];
    field_mappings?: Record<string, string>;
    excluded_inputs?: string[];
}
export interface ProductMapping {
    [key: string]: any;
}
export interface CheckoutCampaign {
    id: string;
    product_mapping: ProductMapping;
    input_mapping: InputMapping | null;
    total_selector?: string;
    average_checkout_value?: number;
    type: "bookvisit" | "synxis" | "elinapms" | "default";
    config: {
        bookvisit?: {
            channel_id: string;
            autofields?: boolean;
            /** Per-hotel switch for features.cartRestore. */
            restore?: boolean;
        };
    };
}
/** A room as stored in a BookVisit cart session's `products`. */
export interface BookVisitRoomProduct extends DetectedProduct {
    /** BookVisit roomId. */
    id: string;
    type: "room";
    /** YYYY-MM-DD */
    startDate: string;
    /** YYYY-MM-DD */
    endDate: string;
    price: number;
    /** Missing on sessions saved before v1.4.0; `ratePlan` (name) is the fallback. */
    ratePlanId?: string;
    ratePlan?: string;
    roomConfig?: {
        adults?: number;
        childAges?: number[] | null;
        [key: string]: any;
    } | null;
}
/** What `get-checkout-session-restore` returns. */
export interface CartRestoreSpec {
    /**
     * The cart session the link belongs to. Like the contact details below,
     * only returned for links carrying their secret `rt` token.
     */
    session_id: string | null;
    products: DetectedProduct[];
    /** A promo code we issued for this cart, applied on restore. */
    promo_code?: string | null;
    /** Contact details the cart was saved with, filled into checkout. */
    email?: string | null;
    /** The phone number, national ("12345678") or full ("+4712345678"). */
    phone?: string | null;
    /** Digits only ("47"), when the site stores it apart from the number. */
    phone_country_code?: string | null;
}
/** Contact details carried from a restore to the checkout form. */
export interface CheckoutContact {
    email?: string;
    phone?: string;
    phoneCountryCode?: string;
}
export interface BookVisitRoomConfig {
    adults: number;
    childAges: number[];
}
export interface BookVisitSearchRequest {
    startDate: string;
    endDate: string;
    roomConfigs: BookVisitRoomConfig[];
    promoCode?: string;
}
/** One bookable rate from a BookVisit search, flattened. */
export interface BookVisitSearchHit {
    hitKey: string;
    roomId: string | null;
    ratePlanId: string | null;
    ratePlanName: string | null;
    /** Integer, in the basket's currency. */
    price: number | null;
    currency: string | null;
    /** The guests this hit is for; rooms are matched on it. */
    roomConfig: BookVisitRoomConfig | null;
}
export interface BookVisitSearchResult {
    /** Sent back with every room added from this search. */
    resultId: string;
    hits: BookVisitSearchHit[];
}
export type CartRestoreOutcome = "restored" | "restored_price_changed" | "basket_exists" | "unavailable" | "invalid_link" | "no_token" | "timeout" | "cancelled" | "failed";
export type CartRestoreNoticeKind = "priceChanged" | "promoApplied" | "unavailable" | "failed";
export interface CartRestoreNotice {
    kind: CartRestoreNoticeKind;
    /** Integers, in `currency`. */
    oldPrice?: number;
    newPrice?: number;
    savings?: number;
    currency?: string | null;
    promoCode?: string;
}
export interface Content {
    [key: string]: any;
}
export interface DetectedProduct {
    id?: string;
    name?: string;
    price?: number;
    quantity?: number;
    [key: string]: any;
}
export interface CartSessionPayload {
    organization_id: string;
    checkout_campaign_id: string;
    content: Content;
    products?: DetectedProduct[];
    url?: string;
    total?: number;
    id?: string;
    /**
     * JSON string: attribution payload (latest touch + first_* + history),
     * `enhanced_insights`, `device` ('desktop' | 'mobile' | 'tablet') and,
     * when a stay was captured, `ei_stay` (see StayParams).
     */
    analytics?: string;
    metadata?: {
        sbeSessionId?: string | null;
        shoppingCartId?: string | null;
        sbeRc?: string | null;
        sbeRcDecoded?: string | null;
        bookingShoppingCart?: string | null;
        /** BookVisit: booking number / code when the basket carries one. */
        bookingReference?: string | null;
        /** BookVisit: guest country code from the basket, when present. */
        guestCountry?: string | null;
    };
}
/** A stay the visitor searched for, read from listing-page URL params. */
export interface StayParams {
    /** YYYY-MM-DD */
    checkin: string;
    /** YYYY-MM-DD */
    checkout: string;
    adults?: number;
    children?: number;
    /** ISO timestamp of the page view it was read from. */
    captured_at: string;
    /** origin + pathname of that page. */
    url: string;
}
export interface CartSessionResponse {
    id: string;
    success: boolean;
    message?: string;
}
export interface OrganizationPipelineInputMapping {
    [fieldName: string]: {
        type: "input" | "button" | "checkbox";
        selector_type: "name" | "id" | "querySelector" | "class" | string;
        selector_value: string;
        default_value?: any;
        mode?: "toggle";
        true_value?: string;
    };
}
export interface OrganizationPipelineCampaign {
    id: string;
    input_mapping: OrganizationPipelineInputMapping;
    button_mapping: {
        selector_type: string;
        selector_value: string;
    };
    additional_properties?: Record<string, any>;
    organization_id: string;
}
export interface OrganizationPipelinePayload {
    [key: string]: any;
    ainternal_pipeline_campaign_id: string;
}
//# sourceMappingURL=index.d.ts.map