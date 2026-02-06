import { getUserLocale } from "../../../utils/locale";

export type LocalizationKey =
    | "creditCheckRequired"
    | "creditCheckDescription"
    | "checkCreditButton"
    | "startingCreditCheck"
    | "creditCheckError"
    | "creditCheckNotApproved"
    | "couldNotCreateSession";

const translations: Record<
    LocalizationKey,
    Record<string, string>
> = {
    creditCheckRequired: {
        en: "Credit check required",
        nb: "Kredittjekk påkrevd",
        nn: "Kredittjekk påkrevd",
        no: "Kredittjekk påkrevd",
        sv: "Kredittkontroll krävs",
        da: "Kreditcheck påkrævet",
        de: "Kreditprüfung erforderlich",
        fr: "Vérification de crédit requise",
        es: "Verificación de crédito requerida",
        it: "Verifica del credito richiesta",
        nl: "Kredietcontrole vereist",
        pl: "Wymagana weryfikacja kredytowa",
    },
    creditCheckDescription: {
        en: "In order to use the storage unit you must first pass a credit check. This is a security process that helps us verify your identity.",
        nb: "For å bruke lagringsenheten må du først gjennomføre en kredittjekk. Dette er en sikkerhetsprosess som hjelper oss med å verifisere din identitet.",
        nn: "For å bruke lagringsenheten må du først gjennomføre ein kredittjekk. Dette er ein sikkerheitsprosess som hjelper oss med å verifisere identiteten din.",
        no: "For å bruke lagringsenheten må du først gjennomføre en kredittjekk. Dette er en sikkerhetsprosess som hjelper oss med å verifisere din identitet.",
        sv: "För att använda lagringsenheten måste du först genomgå en kredittkontroll. Detta är en säkerhetsprocess som hjälper oss att verifiera din identitet.",
        da: "For at bruge lagringsenheden skal du først bestå en kreditcheck. Dette er en sikkerhedsproces, der hjælper os med at verificere din identitet.",
        de: "Um die Lagereinheit zu nutzen, müssen Sie zunächst eine Kreditprüfung bestehen. Dies ist ein Sicherheitsprozess, der uns hilft, Ihre Identität zu überprüfen.",
        fr: "Pour utiliser l'unité de stockage, vous devez d'abord passer une vérification de crédit. Il s'agit d'un processus de sécurité qui nous aide à vérifier votre identité.",
        es: "Para usar la unidad de almacenamiento, primero debe pasar una verificación de crédito. Este es un proceso de seguridad que nos ayuda a verificar su identidad.",
        it: "Per utilizzare l'unità di stoccaggio, devi prima superare una verifica del credito. Questo è un processo di sicurezza che ci aiuta a verificare la tua identità.",
        nl: "Om de opslageenheid te gebruiken, moet u eerst een kredietcontrole doorstaan. Dit is een beveiligingsproces dat ons helpt uw identiteit te verifiëren.",
        pl: "Aby korzystać z jednostki magazynowej, musisz najpierw przejść weryfikację kredytową. Jest to proces bezpieczeństwa, który pomaga nam zweryfikować Twoją tożsamość.",
    },
    checkCreditButton: {
        en: "Check credit",
        nb: "Sjekk kreditt",
        nn: "Sjekk kreditt",
        no: "Sjekk kreditt",
        sv: "Kontrollera kredit",
        da: "Tjek kredit",
        de: "Kreditprüfung",
        fr: "Vérifier le crédit",
        es: "Verificar crédito",
        it: "Verifica credito",
        nl: "Krediet controleren",
        pl: "Sprawdź kredyt",
    },
    startingCreditCheck: {
        en: "Starting credit check...",
        nb: "Starter kredittjekk...",
        nn: "Startar kredittjekk...",
        no: "Starter kredittjekk...",
        sv: "Startar kredittkontroll...",
        da: "Starter kreditcheck...",
        de: "Kreditprüfung wird gestartet...",
        fr: "Démarrage de la vérification de crédit...",
        es: "Iniciando verificación de crédito...",
        it: "Avvio verifica del credito...",
        nl: "Kredietcontrole starten...",
        pl: "Rozpoczynanie weryfikacji kredytowej...",
    },
    creditCheckError: {
        en: "An error occurred during the credit check",
        nb: "En feil oppstod under kredittjekken",
        nn: "Ein feil oppstod under kredittjekken",
        no: "En feil oppstod under kredittjekken",
        sv: "Ett fel uppstod under kredittkontrollen",
        da: "Der opstod en fejl under kreditchecken",
        de: "Während der Kreditprüfung ist ein Fehler aufgetreten",
        fr: "Une erreur s'est produite lors de la vérification de crédit",
        es: "Ocurrió un error durante la verificación de crédito",
        it: "Si è verificato un errore durante la verifica del credito",
        nl: "Er is een fout opgetreden tijdens de kredietcontrole",
        pl: "Wystąpił błąd podczas weryfikacji kredytowej",
    },
    creditCheckNotApproved: {
        en: "Credit check was not approved",
        nb: "Kredittjekk ble ikke godkjent",
        nn: "Kredittjekk vart ikkje godkjend",
        no: "Kredittjekk ble ikke godkjent",
        sv: "Kredittkontrollen godkändes inte",
        da: "Kreditchecken blev ikke godkendt",
        de: "Kreditprüfung wurde nicht genehmigt",
        fr: "La vérification de crédit n'a pas été approuvée",
        es: "La verificación de crédito no fue aprobada",
        it: "La verifica del credito non è stata approvata",
        nl: "Kredietcontrole is niet goedgekeurd",
        pl: "Weryfikacja kredytowa nie została zatwierdzona",
    },
    couldNotCreateSession: {
        en: "Could not create credit check session",
        nb: "Kunne ikke opprette kredittjekk-sesjon",
        nn: "Kunne ikkje opprette kredittjekk-sesjon",
        no: "Kunne ikke opprette kredittjekk-sesjon",
        sv: "Kunde inte skapa kredittkontrollsession",
        da: "Kunne ikke oprette kreditchecksession",
        de: "Kreditprüfungssitzung konnte nicht erstellt werden",
        fr: "Impossible de créer une session de vérification de crédit",
        es: "No se pudo crear la sesión de verificación de crédito",
        it: "Impossibile creare la sessione di verifica del credito",
        nl: "Kon geen kredietcontrolesessie maken",
        pl: "Nie można utworzyć sesji weryfikacji kredytowej",
    },
};

/**
 * Get localized string for credit check module
 * @param key - The localization key
 * @param locale - Optional locale override. If not provided, uses browser locale
 * @returns Localized string, falls back to English if locale not found
 */
export function getLocalizedString(
    key: LocalizationKey,
    locale?: string
): string {
    const userLocale = locale || getUserLocale();
    const translation = translations[key];

    if (!translation) {
        console.warn(`Translation key "${key}" not found`);
        return key;
    }

    // Get translation for the locale, default to English if locale is unknown
    const localeTranslation = translation[userLocale];
    if (localeTranslation) {
        return localeTranslation;
    }

    // Default to English for unknown locales
    return translation["en"] || key;
}
