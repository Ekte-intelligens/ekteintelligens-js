import { initEmailMonitor } from './stora/emailMonitor.ts';
import { initBookingComplete } from './stora/bookingComplete.ts';

export interface StoraCreditCheckConfig {
    organization_id: string;
    integration_type: 'stora';
    integration_subscriber_id?: string;
}

class StoraCreditCheck {
    private config: StoraCreditCheckConfig | null = null;
    private initialized = false;

    /**
     * Initialize the Stora credit check integration
     */
    init(config: StoraCreditCheckConfig): void {
        if (this.initialized) {
            console.warn('StoraCreditCheck already initialized');
            return;
        }

        if (!config.organization_id) {
            throw new Error('organization_id is required');
        }

        if (config.integration_type !== 'stora') {
            throw new Error('integration_type must be "stora"');
        }

        this.config = config;
        this.initialized = true;

        // Initialize email monitoring for order/contact-details pages
        initEmailMonitor(config);

        // Initialize booking complete handler
        initBookingComplete(config);

        console.log('StoraCreditCheck initialized', config);
    }

    /**
     * Get current configuration
     */
    getConfig(): StoraCreditCheckConfig | null {
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
export { storaCreditCheck };

// Expose globally for script injection
if (typeof window !== 'undefined') {
    (window as any).StoraCreditCheck = storaCreditCheck;
}
