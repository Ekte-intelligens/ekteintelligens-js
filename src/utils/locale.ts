export class Locale {
    /**
     * The visitor's language code from browser settings ("en-US" -> "en",
     * "nb-NO" -> "nb"). Defaults to "en".
     */
    public static getUserLocale(): string {
        if (typeof navigator === "undefined") {
            return "en";
        }
        if (navigator.languages && navigator.languages.length > 0) {
            return navigator.languages[0].split("-")[0].toLowerCase();
        }
        if (navigator.language) {
            return navigator.language.split("-")[0].toLowerCase();
        }
        return "en";
    }
}
