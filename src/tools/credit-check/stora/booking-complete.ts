import type { StoraCreditCheckConfig } from "../types";
import { getStoredEmail } from "./email-monitor";
import {
    createCreditCheckSession,
    checkCreditCheckStatus,
} from "../services/credit-check-session";
import { showCreditCheckDialog } from "./dialog";
import type { CreditCheckSession } from "../types";
import type { CriiptoConfig } from "../auth/criipto";

/**
 * Initialize booking complete page handler
 */
export const initBookingComplete = (
    config: StoraCreditCheckConfig & {
        criiptoConfig: CriiptoConfig;
    }
): void => {
    if (config.integration_type !== "stora") {
        return;
    }

    // Wait for DOM to be ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            setupBookingComplete(config);
        });
    } else {
        setupBookingComplete(config);
    }
};

/**
 * Set up booking complete page
 */
const setupBookingComplete = async (
    config: StoraCreditCheckConfig & {
        criiptoConfig: CriiptoConfig;
    }
): Promise<void> => {
    // Check if we're on the booking complete page
    const bookingComplete = document.querySelector<HTMLElement>(
        ".booking-complete"
    );

    if (!bookingComplete) {
        // Not on booking complete page
        return;
    }

    console.log("Booking complete page detected");

    // Get stored email
    const email = getStoredEmail(config.organization_id);

    if (!email) {
        console.warn(
            "No email found in localStorage for credit check"
        );
        // Still show the dialog, but it might fail when trying to create session
    }

    try {
        // Initialize credit check session on page load
        // This creates the session but doesn't show the dialog yet
        let session: CreditCheckSession | null = null;

        if (email) {
            try {
                session = await createCreditCheckSession(
                    {
                        organization_id: config.organization_id,
                        integration_type: "stora",
                        integration_subscriber_id:
                            config.integration_subscriber_id,
                        email: email,
                    },
                    config.supabaseUrl,
                    config.supabaseAnonKey
                );
                console.log("Credit check session initialized:", session);
            } catch (error) {
                console.error(
                    "Failed to initialize credit check session:",
                    error
                );
            }
        }

        // Check if credit check already exists and is passed
        if (session) {
            const existingStatus = await checkCreditCheckStatus(
                config.organization_id,
                session.subscriber_id,
                config.supabaseUrl,
                config.supabaseAnonKey
            );

            if (
                existingStatus &&
                (existingStatus.status === "approved" ||
                    existingStatus.status === "passed" ||
                    existingStatus.status === "completed")
            ) {
                // Credit check already passed, show default content
                console.log(
                    "Credit check already passed, showing default content"
                );
                return;
            }
        }

        // Show credit check dialog
        const actionsSection = bookingComplete.querySelector<HTMLElement>(
            ".booking-complete__actions_section"
        );
        if (actionsSection) {
            showCreditCheckDialog(bookingComplete, {
                organizationId: config.organization_id,
                criiptoConfig: config.criiptoConfig,
                supabaseUrl: config.supabaseUrl,
                supabaseAnonKey: config.supabaseAnonKey,
                session: session, // Pass the created session
                onCreditCheckComplete: (completedSession) => {
                    console.log(
                        "Credit check completed:",
                        completedSession
                    );
                    // Session is already updated, page will show default content
                },
                onError: (error) => {
                    console.error("Credit check error:", error);
                },
            });
        } else {
            console.warn(
                "Could not find booking-complete__actions_section"
            );
        }
    } catch (error) {
        console.error("Error setting up booking complete:", error);
    }
};
