# Credit Check Module - Test Files

This directory contains test HTML files for the Stora credit check integration.

## Test Files

### 1. `credit-check-test-index.html`
Main test index page with links to all test pages.

### 2. `credit-check-order-page.html`
Simulates the Stora order/contact-details page where users enter their email address.

**Features:**
- Email input field (`#order_form_email`) that matches Stora's structure
- Automatic email monitoring and localStorage storage
- Real-time localStorage status display
- Navigation to booking complete page

### 3. `credit-check-booking-complete.html`
Simulates the Stora booking complete page where the credit check dialog appears.

**Features:**
- Booking complete page structure matching Stora's HTML
- Credit check dialog that replaces default content
- Test controls to simulate different scenarios
- localStorage status monitoring

## How to Test

### Option 1: Local Development (Recommended)

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Start a local server:**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Or using Node.js http-server
   npx http-server -p 8000
   
   # Or using Vite preview
   npm run preview
   ```

3. **Open the test index:**
   ```
   http://localhost:8000/examples/credit-check-test-index.html
   ```

### Option 2: Using CDN (Production Testing)

The test files will automatically fall back to CDN if the local build is not found. Make sure the package is published to npm first.

## Testing Flow

1. **Start at Order Page:**
   - Open `credit-check-order-page.html`
   - Enter an email address (e.g., `test@example.com`)
   - Verify the email is stored in localStorage (check the status display)
   - The storage key will be: `stora_credit_check_email_test-organization-id`

2. **Navigate to Booking Complete:**
   - Click "Continue to Booking Complete" button
   - Or manually open `credit-check-booking-complete.html`

3. **Verify Credit Check Dialog:**
   - The credit check dialog should appear automatically
   - It replaces the default "Neste skritt" section
   - The dialog shows localized text based on your browser's language

4. **Test Credit Check Flow:**
   - Click "Sjekk kreditt" (or "Check credit" in English)
   - BankID popup should open (requires valid Criipto credentials)
   - After authentication, the default booking content should reappear

## Configuration

Update these values in the HTML files to match your setup:

```javascript
storaCreditCheck.init({
    organization_id: 'your-organization-id',
    integration_type: 'stora',
    criiptoConfig: {
        domain: 'your-domain.criipto.id',
        clientId: 'your-client-id'
    },
    supabaseUrl: 'optional-supabase-url',
    supabaseAnonKey: 'optional-supabase-key'
});
```

## Test Controls

The booking complete page includes test controls:
- **Set Test Email**: Manually set an email in localStorage
- **Clear Email**: Remove email from localStorage
- **Reload Page**: Refresh to test initialization
- **Go to Order Page**: Navigate back to order page

## Expected Behavior

### Email Monitoring
- Email is stored when user types in the `#order_form_email` field
- Email is stored on both `input` and `change` events
- Email is validated (must contain `@` and be at least 3 characters)
- Storage key includes organization ID for namespacing

### Booking Complete Page
- Page is detected by `.booking-complete` class
- If email exists in localStorage:
  - Credit check session is created automatically
  - Existing credit check status is checked
  - If not approved, dialog is shown
  - Default content is hidden while dialog is visible
- If email doesn't exist:
  - Default content is shown
  - No dialog appears

### Credit Check Dialog
- Shows localized text based on browser locale
- Has a blue border to indicate importance
- Displays title, description, and "Check credit" button
- Shows loading state when button is clicked
- Shows error messages if something goes wrong
- Hides and shows default content when credit check completes

## Troubleshooting

### Dialog doesn't appear
- Check browser console for errors
- Verify email is stored in localStorage
- Check that `.booking-complete` element exists on page
- Verify credit check module is initialized

### Email not being stored
- Check that input field has ID `order_form_email`
- Verify credit check module is initialized before user enters email
- Check browser console for errors
- Verify localStorage is available (not in private/incognito mode)

### BankID popup doesn't open
- Verify Criipto credentials are correct
- Check browser console for authentication errors
- Ensure popup blockers are disabled
- Verify network connectivity

## Browser Support

- Modern browsers with ES2020 support
- localStorage support required
- Fetch API support required
- ES modules support required
