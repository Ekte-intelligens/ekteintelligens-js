/**
 * Get the user's locale from browser settings
 * @returns Two-letter language code (e.g., "en", "nb", "de")
 */
export function getUserLocale(): string {
    if (typeof navigator === "undefined") {
        return "en"; // Default to English if navigator is not available
    }

    // Try to get locale from navigator.languages (preferred languages)
    if (navigator.languages && navigator.languages.length > 0) {
        const locale = navigator.languages[0];
        // Extract language code (e.g., "en-US" -> "en", "nb-NO" -> "nb")
        return locale.split("-")[0].toLowerCase();
    }

    // Fallback to navigator.language
    if (navigator.language) {
        return navigator.language.split("-")[0].toLowerCase();
    }

    return "en"; // Default to English
}
