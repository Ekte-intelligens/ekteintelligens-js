import { CartRestoreNotice } from "../types";
import { Locale } from "./locale";

type MessageKey =
    | "restoring"
    | "close"
    | "priceChanged"
    | "promoApplied"
    | "unavailable"
    | "failed";

/** All text shown by cart restore. `{name}` placeholders are filled in. */
export class RestoreMessages {
    private static readonly TEXT: Record<string, Record<MessageKey, string>> = {
        en: {
            restoring: "Restoring your booking…",
            close: "Close",
            priceChanged:
                "We restored your booking. The price has changed from {oldPrice} to {newPrice} since you last visited.",
            promoApplied:
                "Your code {promoCode} has been applied. You save {savings}.",
            unavailable:
                "Unfortunately, the room you selected is no longer available for your dates. Please choose another room or other dates.",
            failed:
                "We could not restore your booking. Please search again to continue.",
        },
        nb: {
            restoring: "Gjenoppretter bestillingen din…",
            close: "Lukk",
            priceChanged:
                "Vi har gjenopprettet bestillingen din. Prisen er endret fra {oldPrice} til {newPrice} siden sist.",
            promoApplied:
                "Koden {promoCode} er lagt til. Du sparer {savings}.",
            unavailable:
                "Dessverre er rommet du valgte ikke lenger tilgjengelig for datoene dine. Velg et annet rom eller andre datoer.",
            failed:
                "Vi klarte ikke å gjenopprette bestillingen din. Søk på nytt for å fortsette.",
        },
        sv: {
            restoring: "Återställer din bokning…",
            close: "Stäng",
            priceChanged:
                "Vi har återställt din bokning. Priset har ändrats från {oldPrice} till {newPrice} sedan sist.",
            promoApplied:
                "Koden {promoCode} har lagts till. Du sparar {savings}.",
            unavailable:
                "Tyvärr är rummet du valde inte längre tillgängligt för dina datum. Välj ett annat rum eller andra datum.",
            failed:
                "Vi kunde inte återställa din bokning. Sök igen för att fortsätta.",
        },
        da: {
            restoring: "Gendanner din booking…",
            close: "Luk",
            priceChanged:
                "Vi har gendannet din booking. Prisen er ændret fra {oldPrice} til {newPrice} siden sidst.",
            promoApplied:
                "Koden {promoCode} er tilføjet. Du sparer {savings}.",
            unavailable:
                "Desværre er det valgte værelse ikke længere ledigt på dine datoer. Vælg et andet værelse eller andre datoer.",
            failed:
                "Vi kunne ikke gendanne din booking. Søg igen for at fortsætte.",
        },
        de: {
            restoring: "Ihre Buchung wird wiederhergestellt…",
            close: "Schließen",
            priceChanged:
                "Wir haben Ihre Buchung wiederhergestellt. Der Preis hat sich seit Ihrem letzten Besuch von {oldPrice} auf {newPrice} geändert.",
            promoApplied:
                "Ihr Code {promoCode} wurde angewendet. Sie sparen {savings}.",
            unavailable:
                "Leider ist das gewählte Zimmer für Ihre Daten nicht mehr verfügbar. Bitte wählen Sie ein anderes Zimmer oder andere Daten.",
            failed:
                "Ihre Buchung konnte nicht wiederhergestellt werden. Bitte suchen Sie erneut.",
        },
    };

    private static readonly LOCALE_ALIASES: Record<string, string> = {
        no: "nb",
        nn: "nb",
    };

    public static get(key: MessageKey): string {
        const locale = RestoreMessages.locale();
        return RestoreMessages.TEXT[locale][key];
    }

    public static forNotice(notice: CartRestoreNotice): string {
        const amount = (value?: number) =>
            RestoreMessages.formatMoney(value ?? 0, notice.currency);
        const values: Record<string, string> = {
            oldPrice: amount(notice.oldPrice),
            newPrice: amount(notice.newPrice),
            savings: amount(notice.savings),
            promoCode: notice.promoCode ?? "",
        };
        return RestoreMessages.get(notice.kind).replace(
            /\{(\w+)\}/g,
            (match, name: string) => values[name] ?? match,
        );
    }

    private static locale(): string {
        const locale = Locale.getUserLocale();
        const resolved = RestoreMessages.LOCALE_ALIASES[locale] ?? locale;
        return RestoreMessages.TEXT[resolved] ? resolved : "en";
    }

    private static formatMoney(amount: number, currency?: string | null): string {
        const locale = RestoreMessages.locale();
        if (currency) {
            try {
                return new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency,
                    maximumFractionDigits: 0,
                }).format(amount);
            } catch {
                // Unknown currency code: fall through to a plain number.
            }
        }
        const number = new Intl.NumberFormat(locale, {
            maximumFractionDigits: 0,
        }).format(amount);
        return currency ? `${number} ${currency}` : number;
    }
}
