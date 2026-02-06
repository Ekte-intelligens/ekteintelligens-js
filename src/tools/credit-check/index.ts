import { initEmailMonitor } from "./stora/email-monitor";
import { initBookingComplete } from "./stora/booking-complete";
import type { StoraCreditCheckConfig } from "./types";
import type { CriiptoConfig } from "./auth/criipto";

export interface StoraCreditCheckInitConfig extends StoraCreditCheckConfig {
    criiptoConfig: CriiptoConfig;
}

class StoraCreditCheck {
    private config: StoraCreditCheckInitConfig | null = null;
    private initialized = false;

    /**
     * Initialize the Stora credit check integration
     */
    init(config: StoraCreditCheckInitConfig): void {
        if (this.initialized) {
            console.warn("StoraCreditCheck already initialized");
            return;
        }

        if (!config.organization_id) {
            throw new Error("organization_id is required");
        }

        if (config.integration_type !== "stora") {
            throw new Error('integration_type must be "stora"');
        }

        if (!config.criiptoConfig || !config.criiptoConfig.domain || !config.criiptoConfig.clientId) {
            throw new Error("criiptoConfig with domain and clientId is required");
        }

        this.config = config;
        this.initialized = true;

        // Initialize email monitoring for order/contact-details pages
        initEmailMonitor(config);

        // Initialize booking complete handler
        initBookingComplete(config);

        console.log("StoraCreditCheck initialized", config);
    }

    /**
     * Get current configuration
     */
    getConfig(): StoraCreditCheckInitConfig | null {
        return this.config;
    }

    /**
     * Check if initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}

// Create singleton instance
const storaCreditCheck = new StoraCreditCheck();

// Export for use in modules
export { storaCreditCheck, StoraCreditCheck };

// Expose globally for script injection
if (typeof window !== "undefined") {
    (window as any).StoraCreditCheck = storaCreditCheck;
}
