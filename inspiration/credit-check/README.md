# Stora Credit Check Integration

A JavaScript library that integrates with Stora booking pages to collect customer email addresses and display a credit check dialog on the booking completion page. The library handles the complete credit check flow including BankID authentication and session management.

## Overview

This integration enables automatic credit check workflows for Stora storage unit bookings. It:

- Monitors email input on order/contact-details pages
- Stores email addresses in localStorage for later use
- Displays a credit check dialog on booking completion pages
- Integrates with BankID for identity verification
- Manages credit check sessions via Supabase edge functions
- Prevents duplicate credit checks by checking existing sessions

## Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Stora Page Load                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   Page Type Check      │
            └───────┬───────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐      ┌──────────────────┐
│ order/contact │      │ booking_complete │
│   -details    │      │      page        │
└───────┬───────┘      └────────┬─────────┘
        │                       │
        ▼                       ▼
┌───────────────┐      ┌──────────────────┐
│ Monitor Email │      │ Check Existing   │
│    Input      │      │  Credit Check    │
└───────┬───────┘      └────────┬─────────┘
        │                       │
        ▼                       ▼
┌───────────────┐      ┌──────────────┐
│ Store Email   │      │ Show Dialog  │
│ localStorage  │      │ or Default   │
└───────────────┘      └──────┬───────┘
                               │
                               ▼
                      ┌────────────────┐
                      │ User Clicks     │
                      │ "Check Credit"  │
                      └────────┬───────┘
                               │
                               ▼
                      ┌────────────────┐
                      │ Create Session │
                      │ (Backend API)  │
                      └────────┬───────┘
                               │
                               ▼
                      ┌────────────────┐
                      │ Open BankID    │
                      │    Popup       │
                      └────────┬───────┘
                               │
                               ▼
                      ┌────────────────┐
                      │ Complete Check │
                      │ Update Status  │
                      └────────┬───────┘
                               │
                               ▼
                      ┌────────────────┐
                      │ Show Default   │
                      │ Booking Content│
                      └────────────────┘
```

### Component Structure

```
src/
├── stora-integration.ts      # Main entry point and initializer
├── stora/
│   ├── emailMonitor.ts       # Email input monitoring
│   ├── bookingComplete.ts    # Booking complete page handler
│   └── dialog.ts             # Credit check dialog component
├── services/
│   ├── creditCheckSession.ts # Session management service
│   └── supabase/
│       └── index.ts          # Supabase client setup
└── auth/
    ├── index.ts              # BankID authentication
    └── criipto/
        └── index.ts          # Criipto BankID integration
```

## Installation & Build

### Prerequisites

- Node.js 18+ and npm
- Supabase project with edge functions deployed
- Stora API credentials configured in Supabase

### Build for Production

```bash
# Install dependencies
npm install

# Build the Stora integration library
npm run build:stora
```

This creates a single bundled file at `dist/stora-credit-check.js` that can be deployed to a CDN (e.g., jsdelivr).

### Environment Variables

The build process injects Supabase credentials from environment variables:

- `PROD` or `LOCAL_PROD` - Set to enable production Supabase URLs
- Supabase URL and API key are read from the Supabase client configuration

## Usage

### 1. Include the Script

Add the script to your Stora pages via CDN:

```html
<script src="https://cdn.jsdelivr.net/gh/your-org/repo@version/dist/stora-credit-check.js"></script>
```

Or include it directly:

```html
<script src="/path/to/stora-credit-check.js"></script>
```

### 2. Initialize the Integration

Initialize the credit check integration on your Stora pages:

```javascript
// Initialize with required configuration
window.StoraCreditCheck.init({
    organization_id: 'your-organization-uuid',
    integration_type: 'stora',
    integration_subscriber_id: 'optional-subscriber-id' // Optional
});
```

### Configuration Options

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organization_id` | string | Yes | Your organization UUID from Supabase |
| `integration_type` | 'stora' | Yes | Must be 'stora' |
| `integration_subscriber_id` | string | No | Optional Stora subscriber identifier |

### 3. How It Works

#### Email Monitoring (Order/Contact-Details Page)

The script automatically monitors the email input field:

```html
<input 
    class="input" 
    autocomplete="email" 
    type="email" 
    name="order_form[email]" 
    id="order_form_email"
>
```

When a user enters their email, it's stored in localStorage with the key:
```
stora_credit_check_email_{organization_id}
```

#### Booking Complete Page

On the booking completion page (detected by `.booking-complete` class), the script:

1. Retrieves the stored email from localStorage
2. Creates a credit check session (if email exists)
3. Checks if a credit check already exists and is approved
4. Shows the credit check dialog if needed
5. Replaces the default booking complete content until credit check is passed

#### Credit Check Dialog

The dialog displays:
- Explanation that credit check is required to use the storage unit
- "Sjekk kreditt" (Check credit) button
- Loading states during the process
- Error messages if something goes wrong

When the user clicks "Sjekk kreditt":
1. A credit check session is created (if not already created)
2. BankID popup opens for identity verification
3. Credit check is processed
4. Session status is updated
5. Default booking complete content is restored

## Backend API

### Create Credit Check Session

**Endpoint:** `POST /functions/v1/create-credit-check-session`

**Request Body:**
```json
{
    "organization_id": "uuid",
    "integration_type": "stora",
    "email": "user@example.com",
    "integration_subscriber_id": "optional-id"
}
```

**Response:**
```json
{
    "id": "session-uuid",
    "organization_id": "uuid",
    "subscriber_id": 123,
    "status": "pending",
    "config": {
        "integration_type": "stora",
        "integration_meta": {
            "contact": {
                "id": "stora-contact-id",
                "email": "user@example.com",
                "first_name": "John",
                "last_name": "Doe"
            }
        }
    }
}
```

**Status Values:**
- `pending` - Credit check not yet completed
- `approved` - Credit check passed
- `passed` - Credit check passed (alternative)
- `completed` - Credit check completed

### Features

- **Email-based Contact Lookup**: When email is provided, the backend searches Stora contacts by email
- **Existing Session Detection**: Checks for existing approved credit checks to prevent duplicates
- **Automatic Subscriber Creation**: Creates or retrieves subscriber records from Stora contact data
- **Stora User Mapping**: Stores mapping between Stora contacts and internal subscribers

## Development

### Local Development

```bash
# Start development server
npm run dev

# Build for production
npm run build:stora
```

### Project Structure

- **Frontend**: TypeScript modules that run in the browser
- **Backend**: Supabase Edge Function (`backend/supabase/functions/create-credit-check-session`)
- **Services**: Supabase client and session management
- **Auth**: BankID integration via Criipto

### Key Files

- `src/stora-integration.ts` - Main initialization and entry point
- `src/stora/emailMonitor.ts` - Email input monitoring logic
- `src/stora/bookingComplete.ts` - Booking complete page handler
- `src/stora/dialog.ts` - Credit check dialog UI component
- `src/services/creditCheckSession.ts` - Session API client
- `vite.config.ts` - Build configuration for library output

## Deployment

### Build and Deploy

1. **Build the library:**
   ```bash
   npm run build:stora
   ```

2. **Commit the built file:**
   ```bash
   git add dist/stora-credit-check.js
   git commit -m "Build Stora credit check integration"
   ```

3. **Tag the release:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **Deploy to CDN:**
   The file can now be accessed via jsdelivr:
   ```
   https://cdn.jsdelivr.net/gh/your-org/repo@v1.0.0/dist/stora-credit-check.js
   ```

### Integration in Stora

Add the script tag to your Stora pages (typically in a custom script section or via Stora's script injection feature):

```html
<script src="https://cdn.jsdelivr.net/gh/your-org/repo@v1.0.0/dist/stora-credit-check.js"></script>
<script>
    window.StoraCreditCheck.init({
        organization_id: 'your-organization-uuid',
        integration_type: 'stora'
    });
</script>
```

## Error Handling

The integration handles various error scenarios:

- **Email not found**: Shows warning but continues (may fail when creating session)
- **Contact not found in Stora**: Returns 404 error
- **API errors**: Displays error message in dialog
- **BankID errors**: Shows error and allows retry
- **Session creation failures**: Logs error and shows user-friendly message

## Browser Support

- Modern browsers with ES2020 support
- localStorage support required
- Fetch API support required

## Security Considerations

- Email addresses are stored in localStorage (client-side only)
- Supabase credentials are injected at build time (not exposed in config)
- BankID authentication uses secure popup flow
- All API calls go through Supabase edge functions with proper authentication

## Troubleshooting

### Script not initializing

- Check browser console for errors
- Verify script is loaded before initialization
- Ensure `window.StoraCreditCheck` is available

### Email not being stored

- Verify email input has ID `order_form_email`
- Check browser localStorage (DevTools > Application > Local Storage)
- Ensure script is initialized before user enters email

### Credit check dialog not showing

- Verify page has `.booking-complete` class
- Check browser console for errors
- Verify email was stored in localStorage
- Check that session was created successfully

### Backend errors

- Verify Supabase edge function is deployed
- Check Stora API credentials are configured
- Verify organization_id is correct
- Check Supabase logs for detailed error messages

## License

ISC

## Support

For issues or questions, please contact the development team or open an issue in the repository.
