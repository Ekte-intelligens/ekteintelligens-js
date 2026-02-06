import type { StoraCreditCheckConfig } from "../types";

const STORAGE_KEY = "stora_credit_check_email";

/**
 * Get storage key with organization namespace
 */
const getStorageKey = (organizationId: string): string => {
    return `${STORAGE_KEY}_${organizationId}`;
};

/**
 * Store email in localStorage
 */
export const storeEmail = (
    organizationId: string,
    email: string
): void => {
    try {
        const key = getStorageKey(organizationId);
        localStorage.setItem(key, email);
        console.log("Stored email for credit check:", email);
    } catch (error) {
        console.error("Failed to store email in localStorage:", error);
    }
};

/**
 * Get stored email from localStorage
 */
export const getStoredEmail = (organizationId: string): string | null => {
    try {
        const key = getStorageKey(organizationId);
        return localStorage.getItem(key);
    } catch (error) {
        console.error("Failed to get email from localStorage:", error);
        return null;
    }
};

/**
 * Clear stored email from localStorage
 */
export const clearStoredEmail = (organizationId: string): void => {
    try {
        const key = getStorageKey(organizationId);
        localStorage.removeItem(key);
    } catch (error) {
        console.error("Failed to clear email from localStorage:", error);
    }
};

/**
 * Validate email format
 */
const isValidEmail = (email: string): boolean => {
    return email.includes("@") && email.length > 3;
};

/**
 * Initialize email monitoring for order/contact-details pages
 */
export const initEmailMonitor = (
    config: StoraCreditCheckConfig
): void => {
    if (config.integration_type !== "stora") {
        return;
    }

    // Wait for DOM to be ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            setupEmailMonitoring(config);
        });
    } else {
        setupEmailMonitoring(config);
    }
};

/**
 * Set up email input monitoring
 */
const setupEmailMonitoring = (
    config: StoraCreditCheckConfig
): void => {
    const emailInput = document.querySelector<HTMLInputElement>(
        "#order_form_email"
    );

    if (!emailInput) {
        // Email input not found, might not be on the right page
        // Try again after a short delay in case it's loaded dynamically
        setTimeout(() => {
            const retryInput = document.querySelector<HTMLInputElement>(
                "#order_form_email"
            );
            if (retryInput) {
                attachEmailListener(retryInput, config);
            }
        }, 1000);
        return;
    }

    attachEmailListener(emailInput, config);
};

/**
 * Attach event listener to email input
 */
const attachEmailListener = (
    emailInput: HTMLInputElement,
    config: StoraCreditCheckConfig
): void => {
    // Store initial value if present
    if (emailInput.value && isValidEmail(emailInput.value)) {
        storeEmail(config.organization_id, emailInput.value.trim());
    }

    // Monitor input changes
    emailInput.addEventListener("input", (event) => {
        const target = event.target as HTMLInputElement;
        const email = target.value.trim();

        if (email && isValidEmail(email)) {
            storeEmail(config.organization_id, email);
        }
    });

    // Also monitor change events (for autocomplete, etc.)
    emailInput.addEventListener("change", (event) => {
        const target = event.target as HTMLInputElement;
        const email = target.value.trim();

        if (email && isValidEmail(email)) {
            storeEmail(config.organization_id, email);
        }
    });

    console.log(
        "Email monitoring initialized for",
        config.organization_id
    );
};
