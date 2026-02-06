import { StoraCreditCheckConfig } from './types';
import { CriiptoConfig } from './auth/criipto';

export interface StoraCreditCheckInitConfig extends StoraCreditCheckConfig {
    criiptoConfig: CriiptoConfig;
}
declare class StoraCreditCheck {
    private config;
    private initialized;
    /**
     * Initialize the Stora credit check integration
     */
    init(config: StoraCreditCheckInitConfig): void;
    /**
     * Get current configuration
     */
    getConfig(): StoraCreditCheckInitConfig | null;
    /**
     * Check if initialized
     */
    isInitialized(): boolean;
}
declare const storaCreditCheck: StoraCreditCheck;
export { storaCreditCheck, StoraCreditCheck };
//# sourceMappingURL=index.d.ts.map