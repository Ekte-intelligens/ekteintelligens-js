export type LocalizationKey = "creditCheckRequired" | "creditCheckDescription" | "checkCreditButton" | "startingCreditCheck" | "creditCheckError" | "creditCheckNotApproved" | "couldNotCreateSession";
/**
 * Get localized string for credit check module
 * @param key - The localization key
 * @param locale - Optional locale override. If not provided, uses browser locale
 * @returns Localized string, falls back to English if locale not found
 */
export declare function getLocalizedString(key: LocalizationKey, locale?: string): string;
//# sourceMappingURL=localization.d.ts.map