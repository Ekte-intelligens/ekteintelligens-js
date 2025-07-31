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
    cartCampaignId: "your-campaign-id",
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
        cartCampaignId: "your-campaign-id",
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
    cartCampaignId: string; // Your cart campaign ID
    supabaseUrl?: string; // Optional - SDK uses our backend by default
    supabaseAnonKey?: string; // Optional - SDK uses our backend by default
    features?: {
        abandonedCart?: boolean; // Enable abandoned cart tracking
    };
}
```

## Features

### Abandoned Cart Tracking

The abandoned cart tool automatically tracks user input on your checkout forms and submits data to your Supabase edge function when email or phone number is detected.

#### How it works:

1. **Campaign Configuration**: Fetches campaign settings from `organizations_checkout_campaigns` table
2. **Input Mapping**:
    - If `input_mapping` is null: listens to all inputs
    - If `input_mapping.form_selector` is set: listens to inputs within that form
    - If `input_mapping.inputs` is set: listens to specific input selectors
3. **Product Detection**: Automatically detects products on the page using product mapping or common e-commerce patterns
4. **Data Collection**: Collects input data on blur events
5. **Session Management**: Creates and updates checkout sessions via Supabase edge function with content, products, and current page URL

#### Input Mapping Examples:

```typescript
// Listen to all inputs
input_mapping: null;

// Listen to inputs within a specific form
input_mapping: {
    form_selector: "#checkout-form";
}

// Listen to specific inputs
input_mapping: {
    inputs: ["#email", "#phone", "#name", "#address"];
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
  input_mapping JSONB
);
```

## Edge Function

The SDK expects a Supabase edge function named `cart-checkout-session` that accepts:

```typescript
interface CartSessionPayload {
    organization_id: string;
    cart_campaign_id: string;
    content: Record<string, any>;
    products?: any[];
    url?: string; // Current page URL with query parameters
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
