import { StoraCreditCheckConfig } from '../types';

/**
 * Store email in localStorage
 */
export declare const storeEmail: (organizationId: string, email: string) => void;
/**
 * Get stored email from localStorage
 */
export declare const getStoredEmail: (organizationId: string) => string | null;
/**
 * Clear stored email from localStorage
 */
export declare const clearStoredEmail: (organizationId: string) => void;
/**
 * Initialize email monitoring for order/contact-details pages
 */
export declare const initEmailMonitor: (config: StoraCreditCheckConfig) => void;
//# sourceMappingURL=email-monitor.d.ts.map