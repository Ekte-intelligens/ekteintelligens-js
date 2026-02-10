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

## Edge Function

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

## Credit Check Module

The credit check module provides Stora integration for credit check workflows. It can be imported separately from the main SDK.

### Installation

The credit check module is included in the main package but can be loaded separately:

```html
<!-- Include the credit check script -->
<script src="https://cdn.jsdelivr.net/npm/ekteintelligens-sdk@latest/dist/credit-check.js"></script>
```

Or as ES module:

```typescript
import { storaCreditCheck, StoraCreditCheck } from 'ekteintelligens-sdk/credit-check';

// Use the singleton instance
storaCreditCheck.init({...});

// Or create your own instance
const creditCheck = new StoraCreditCheck();
creditCheck.init({...});
```

### Usage

```javascript
// Initialize credit check
window.StoraCreditCheck.init({
    organization_id: 'your-organization-uuid',
    integration_type: 'stora',
    integration_subscriber_id: 'optional-id', // Optional
    criiptoConfig: {
        domain: 'your-domain.criipto.id',
        clientId: 'your-client-id'
    },
    supabaseUrl: 'optional-supabase-url', // Optional - uses default if not provided
    supabaseAnonKey: 'optional-supabase-key' // Optional - uses default if not provided
});
```

### How It Works

1. **Email Monitoring**: On order/contact-details pages, the module monitors the email input field (`#order_form_email`) and stores the email in localStorage.

2. **Booking Complete Page**: When the user reaches the booking completion page (detected by `.booking-complete` class), the module:
   - Retrieves the stored email from localStorage
   - Creates a credit check session (if email exists)
   - Checks if a credit check already exists and is approved
   - Shows a credit check dialog if needed, replacing the default booking complete content

3. **Credit Check Dialog**: The dialog displays localized text explaining that a credit check is required. When the user clicks "Check credit":
   - BankID popup opens for identity verification
   - Credit check is processed
   - Session status is updated
   - Default booking complete content is restored

### Localization

The credit check module automatically detects the user's browser locale and displays text in the appropriate language. Supported languages:
- English (en) - default
- Norwegian Bokmål (nb)
- Norwegian Nynorsk (nn)
- Norwegian (no)
- Swedish (sv)
- Danish (da)
- German (de)
- French (fr)
- Spanish (es)
- Italian (it)
- Dutch (nl)
- Polish (pl)

### Backend Function Requirements

The `create-credit-check-session` Supabase edge function needs to:

1. **Accept email parameter** in request body:
   ```typescript
   {
     organization_id: string;
     integration_type: 'stora';
     email: string; // NEW
     integration_subscriber_id?: string;
   }
   ```

2. **Fetch contact by email** using Stora contacts API endpoint:
   - Use the provided email to query Stora contacts
   - Retrieve contact details (id, email, phone, first_name, last_name, etc.)

3. **Check existing credit check**:
   - Query `organizations_credit_check_sessions` table
   - Check if contact already has an approved/passed credit check
   - Return existing session if found

4. **Create or retrieve subscriber**:
   - If contact exists, create or get subscriber record
   - Store mapping between Stora contact and internal subscriber

5. **Return session with contact data**:
   ```typescript
   {
     id: string;
     subscriber_id: number;
     status: 'pending' | 'approved' | 'passed' | 'completed';
     config: {
       integration_type: 'stora';
       integration_meta: {
         contact: {
           id: string;
           email: string;
           // ... other contact fields
         }
       }
     }
   }
   ```

## License

MIT
