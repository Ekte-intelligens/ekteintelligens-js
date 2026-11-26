import { Locale } from "./locale";

type MessageKey = "email";

/**
 * All text shown by the search box email field. It sits among BookVisit's
 * own labels, so it follows the page's language (`<html lang>`) before the
 * browser's.
 */
export class SearchEmailMessages {
    private static readonly TEXT: Record<string, Record<MessageKey, string>> = {
        en: { email: "Email" },
        nb: { email: "E-post" },
        sv: { email: "E-post" },
        da: { email: "E-mail" },
        de: { email: "E-Mail" },
    };

    private static readonly LOCALE_ALIASES: Record<string, string> = {
        no: "nb",
        nn: "nb",
    };

    public static get(key: MessageKey): string {
        return SearchEmailMessages.TEXT[SearchEmailMessages.locale()][key];
    }

    private static locale(): string {
        const pageLanguage =
            typeof document !== "undefined"
                ? document.documentElement.lang.split("-")[0].toLowerCase()
                : "";
        for (const locale of [pageLanguage, Locale.getUserLocale()]) {
            const resolved = SearchEmailMessages.LOCALE_ALIASES[locale] ?? locale;
            if (SearchEmailMessages.TEXT[resolved]) {
                return resolved;
            }
        }
        return "en";
    }
}
