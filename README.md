# EkteIntelligens SDK

A TypeScript SDK for e-commerce tools including abandoned cart tracking and other features.

## Installation

### NPM

```bash
npm install ekteintelligens-sdk
```

### CDN (jsDelivr)

```html
<script src="https://cdn.jsdelivr.net/npm/ekteintelligens-sdk@latest/dist/index.js"></script>
```

## Quick Start

### Using NPM/ES Modules

```typescript
import { EkteIntelligensSDK } from "ekteintelligens-sdk";

const sdk = new EkteIntelligensSDK({
    organizationId: "your-org-id",
    checkoutCampaignId: "your-campaign-id",
    // Supabase credentials are optional - SDK uses our backend by default
    features: {
        abandonedCart: true,
    },
});

await sdk.initialize();
```

### Using CDN

```html
<script>
    const sdk = new EkteIntelligensSDK({
        organizationId: "your-org-id",
        checkoutCampaignId: "your-campaign-id",
        // Supabase credentials are optional - SDK uses our backend by default
        features: {
            abandonedCart: true,
        },
    });

    sdk.initialize().then(() => {
        console.log("SDK initialized successfully");
    });
</script>
```

## Configuration

### SDKOptions

```typescript
interface SDKOptions {
    organizationId: string; // Your organization ID
    checkoutCampaignId: string; // Your checkout campaign ID
    supabaseUrl?: string; // Optional - SDK uses our backend by default
    supabaseAnonKey?: string; // Optional - SDK uses our backend by default
    features?: {
        abandonedCart?: boolean; // Enable abandoned cart tracking
        stayCapture?: boolean; // Remember searched check-in/check-out dates (default true)
    };
}
```

### Stay capture, device and session_count (v1.3.0)

-   **Stay capture** (`features.stayCapture`, default `true`): on every page
    view the SDK looks for stay dates in the URL query (`from`/`to` in US
    `MM/DD/YYYY`, `start`/`end` in `DD/MM/YYYY`, plus `checkin`/`checkout`,
    `check_in`/`check_out`, `arrival`/`departure`, `fromDate`/`toDate`,
    `startDate`/`endDate` in ISO, `DD.MM.YYYY`, `DD/MM/YYYY` or `MM/DD/YYYY`;
    optional numeric `adults`/`children`/`guests`). The latest stay is kept in
    memory and, under the same consent gate as attribution, in localStorage
    `ei_stay_params` for 7 days (cleared when a checkout completes). On cart
    upload, product rows without `startDate`/`endDate` get them (plus
    `nights`) from the captured stay, and the analytics payload carries
    `ei_stay`:
    `{ checkin: "2026-12-27", checkout: "2027-01-03", adults?, children?, captured_at: ISO, url: "https://site/path" }`.
-   **`device`**: `"desktop" | "mobile" | "tablet"` at the top level of the
    analytics payload (client hints first, then a small user-agent check; the
    raw user agent is never stored).
-   **`enhanced_insights.session_count`**: page views grouped into sessions by
    30-minute gaps, next to `visit_count` (which counts page views).
-   **BookVisit `metadata`**: basket id, booking reference and guest country
    from the basket API, like the SynXis and Elina scrapers already send.

## Features

**Elina PMS cart dates.** The Elina booking page carries the stay as ISO data
attributes (`data-startdate`, `data-enddate`, `data-nights`, the same ones
Elina's own analytics script reads). The cart scraper now copies them onto
each product row as `startDate`/`endDate`/`nights`, per item when the item
has them, otherwise from the page-level block. These are exact, so they feed
reminder e-mails and reporting directly; the URL stay capture only fills in
when the page has no attributes.

### Abandoned Cart Tracking

The abandoned cart tool automatically tracks user input on your checkout forms and submits data to your Supabase edge function when email or phone number is detected.

#### How it works:

1. **Campaign Configuration**: Fetches campaign settings from `organizations_checkout_campaigns` table
2. **Input Mapping**:
    - If `input_mapping` is null: listens to all inputs
    - If `input_mapping.form_selector` is set: listens to inputs within that form
    - If `input_mapping.inputs` is set: listens to specific input selectors
    - `input_mapping.excluded_inputs` (names or ids) are never observed
    - Whatever the mapping says, credential, payment-card and national-id inputs are never observed or stored: `type="password"`, `autocomplete` of `cc-*` / `current-password` / `new-password` / `one-time-code`, and names or ids such as `password`, `cvc`, `cardNumber`, `ssn`. The `cart-checkout-session` endpoint drops the same keys server-side
    - A checkbox or radio is only stored while it is checked
3. **Product Detection**: Automatically detects products on the page using product mapping or common e-commerce patterns
4. **Data Collection**: Collects input data on blur events
5. **Session Management**: Creates and updates checkout sessions via Supabase edge function with content, products, and current page URL

#### Input Mapping Examples:

The SDK supports four main input mapping scenarios:

**1. Field mapping for email/phone detection:**

```typescript
input_mapping: {
    inputs: ["#email", "#phone", "#name"],
    field_mappings: {
        "emailAddress": "email",
        "checkoutField-phoneNumber": "phone_number",
        "firstName": "first_name"
    }
}
```

**2. Collecting all input fields on page:**

```typescript
input_mapping: null; // Listens to all inputs on the page
```

**3. Collecting all input fields of form/parent:**

```typescript
input_mapping: {
    form_selector: "#checkout-form"; // Listens to all inputs within the form
}

// Or for any parent container:
input_mapping: {
    form_selector: "#customer-section"; // Listens to all inputs within the section
}
```

**4. Collecting specific input fields only:**

```typescript
input_mapping: {
    inputs: ["#email", "#phone", "#name", "#address"]
}

// With field mappings:
input_mapping: {
    inputs: ["#email", "#phone", "#name", "#address"],
    field_mappings: {
        "emailAddress": "email",
        "checkoutField-phoneNumber": "phone_number",
        "firstName": "first_name",
        "lastName": "last_name"
    }
}
```

#### Product Mapping Examples:

```typescript
// Custom product mapping with standard fields
product_mapping: {
    ".product-item": {
        id_selector: "data-product-id",
        name_selector: ".product-name",
        price_selector: ".product-price",
        quantity_selector: ".product-quantity",
        additional_fields: {
            category: ".product-category",
            brand: ".product-brand"
        }
    }
}

// Flexible field mapping for complex selectors
product_mapping: {
    "#room-details-1": {
        fields: {
            Rominfo: "div > div.bv-flex.bv-flex-col > div:nth-child(1) > p:nth-child(2)",
            Innsjekking: "div > div.bv-flex.bv-flex-col > div:nth-child(2) > p:nth-child(2)",
            Pris: ".price-selector",
            Romtype: ".room-type-selector"
        }
    }
}

// Multiple product detection
product_mapping: {
    ".room-item": {
        fields: {
            Romnavn: ".room-name",
            Pris: ".room-price",
            Beskrivelse: ".room-description"
        }
    },
    ".package-item": {
        fields: {
            Pakkenavn: ".package-name",
            Inkluderer: ".package-includes",
            Varighet: ".package-duration"
        }
    }
}

// Auto-detect common patterns (when product_mapping is empty)
product_mapping: {}
```

#### Total Selector Examples:

```typescript
// Simple ID selector
total_selector: "#cart-total";

// Class selector
total_selector: ".cart-total";

// Complex selector
total_selector: ".checkout-summary .total-amount";

// Data attribute selector
total_selector: "[data-cart-total]";

// Nested selector
total_selector: ".cart-container .summary .total-value";
```

#### Real-World Example: BookVisit Hotel Booking

For a BookVisit hotel booking page, the SDK configuration would be:

```typescript
// Input mapping for form fields with field mappings
input_mapping: {
    inputs: [
        "[data-testid='customer_info_form_firstname']",
        "[data-testid='customer_info_form_lastname']",
        "[data-testid='customer_info_form_email']",
        "[data-testid='customer_info_form_validateemail']",
        "[data-testid='customer_info_form_co_address']",
        "[data-testid='customer_info_form_city']",
        "[data-testid='customer_info_form_postal_code']",
        "[data-testid='customer_info_form_street']",
        "[data-testid='customer_info_form_phone_number']"
    ],
    field_mappings: {
        "emailAddress": "email",
        "checkoutField-phoneNumber": "phone_number",
        "firstName": "first_name",
        "lastName": "last_name",
        "confirmEmailAddress": "confirm_email",
        "coAddress": "co_address",
        "postalCode": "postal_code"
    }
}

// Product mapping for room details
product_mapping: {
    "#room-details-1": {
        fields: {
            Rominfo: ".room-detail-row:nth-child(1) .room-detail-value",
            Innsjekking: ".room-detail-row:nth-child(2) .room-detail-value",
            Avreise: ".room-detail-row:nth-child(3) .room-detail-value",
            Gjester: ".room-detail-row:nth-child(4) .room-detail-value",
            Inkluderer: ".room-detail-row:nth-child(5) .room-detail-value",
            Pris: ".room-detail-row:nth-child(6) .room-detail-value"
        }
    }
}

// Total selector for booking price
total_selector: "#cart-total"
```

This configuration will extract:

-   **Form Data**: Customer information (name, email, phone, address)
-   **Product Data**: Room details (type, check-in/out, guests, amenities, price)
-   **Total**: Booking total price (1 790 NOK)
-   **URL**: Current page URL with query parameters

### Shortlink Open Tracking

Always on — no feature flag required. On every `sdk.initialize()` the SDK
checks the page URL for an `?s=` parameter. This parameter carries the encoded
funnel-subscriber id used in shortlinks we send out (e.g. abandoned-cart
emails). When present, the SDK records an `opened_link` event for that
subscriber via the `create-event` edge function.

-   Fires once per browser session per distinct `?s=` value (deduped via
    `sessionStorage`), so reloads and SPA re-renders don't double-count.
-   It is a complete no-op when no `?s=` parameter is in the URL.
-   Runs fire-and-forget, so it never delays SDK initialization.

## API Reference

### EkteIntelligensSDK

#### Methods

-   `initialize(): Promise<boolean>` - Initialize the SDK and enabled features
-   `destroy(): void` - Clean up resources and stop all tools
-   `isInitialized(): boolean` - Check if SDK is initialized
-   `getAbandonedCartTool(): AbandonedCartTool | undefined` - Get the abandoned cart tool instance

### AbandonedCartTool

#### Methods

-   `getContent(): Record<string, any>` - Get current collected content
-   `hasEmailOrPhone(): boolean` - Check if email or phone has been collected
-   `destroy(): void` - Stop listening to inputs and clean up

## Development

### Setup

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

## Database Schema

### organizations_checkout_campaigns

```sql
CREATE TABLE organizations_checkout_campaigns (
  id UUID PRIMARY KEY,
  product_mapping JSONB,
  input_mapping JSONB,
  total_selector TEXT -- Selector for cart total (id, class, or complex selector)
);
```

## Edge Functions

### create-event

Used by shortlink open tracking. Accepts:

```typescript
{
    id_short_encoded: string; // Encoded funnel-subscriber id from the ?s= param
    type: "funnel_subscriber";
}
```

### cart-checkout-session

The SDK expects a Supabase edge function named `cart-checkout-session` that accepts:

```typescript
interface CartSessionPayload {
    organization_id: string;
    checkout_campaign_id: string;
    content: Record<string, any>;
    products?: any[];
    url?: string; // Current page URL with query parameters
    total?: number; // Cart total value
    id?: string; // Session ID for updates
}
```

And returns:

```typescript
interface CartSessionResponse {
    id: string;
    success: boolean;
    message?: string;
}
```

## License

MIT
