import { CheckoutContact } from "../types";

/**
 * Fills saved contact details into a checkout form that renders after page
 * load. BookVisit's app renders its form a few seconds in and then resets
 * it, so empty fields are filled again for a while. A field the visitor
 * filled, clicked or typed in is left alone.
 */
export class CheckoutPrefill {
    private static readonly WAIT_MS = 20000;
    private static readonly CHECK_EVERY_MS = 250;
    private static readonly EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    private static readonly EMAIL_FIELD = 'input[type="email"]';
    private static readonly COUNTRY_CODE_FIELD = 'input[autocomplete="tel-country-code"]';
    private static readonly NATIONAL_FIELD = 'input[autocomplete="tel-national"]';
    private static readonly PHONE_FIELD = 'input[type="tel"]';

    private stopWaiting?: () => void;
    /** Fields the visitor interacted with, or that held a value of theirs. */
    private visitorFields = new WeakSet<EventTarget>();
    private filledFields = new WeakSet<HTMLInputElement>();

    /** The usable parts of a stored contact, or null when there are none. */
    public static clean(
        email: string | null | undefined,
        phone: string | null | undefined,
        phoneCountryCode: string | null | undefined,
    ): CheckoutContact | null {
        const contact: CheckoutContact = {};
        const trimmedEmail = email?.trim();
        if (trimmedEmail && CheckoutPrefill.EMAIL_PATTERN.test(trimmedEmail)) {
            contact.email = trimmedEmail;
        }
        const number = phone?.replace(/[^\d+]/g, "");
        if (number && number.replace(/\D/g, "").length >= 4) {
            contact.phone = number;
            const countryCode = phoneCountryCode?.replace(/\D/g, "");
            if (countryCode) {
                contact.phoneCountryCode = countryCode;
            }
        }
        return contact.email || contact.phone ? contact : null;
    }

    public fill(contact: CheckoutContact): void {
        this.stopWaiting?.();
        const targets = this.targets(contact);
        const markVisitor = (event: Event) => {
            if (event.target) {
                this.visitorFields.add(event.target);
            }
        };
        document.addEventListener("pointerdown", markVisitor, true);
        document.addEventListener("keydown", markVisitor, true);

        const tick = () => targets.forEach((target) => this.fillTarget(target, contact));
        tick();
        const interval = setInterval(tick, CheckoutPrefill.CHECK_EVERY_MS);
        const timer = setTimeout(() => stop(), CheckoutPrefill.WAIT_MS);
        const stop = () => {
            clearInterval(interval);
            clearTimeout(timer);
            document.removeEventListener("pointerdown", markVisitor, true);
            document.removeEventListener("keydown", markVisitor, true);
            this.stopWaiting = undefined;
        };
        this.stopWaiting = stop;
    }

    public destroy(): void {
        this.stopWaiting?.();
    }

    private targets(contact: CheckoutContact): Array<"email" | "phone"> {
        const targets: Array<"email" | "phone"> = [];
        if (contact.email) targets.push("email");
        if (contact.phone) targets.push("phone");
        return targets;
    }

    private fillTarget(target: "email" | "phone", contact: CheckoutContact): void {
        if (target === "email") {
            const field = this.find(CheckoutPrefill.EMAIL_FIELD);
            if (field) this.setIfEmpty(field, contact.email as string);
            return;
        }

        const { countryCode, number } = this.splitPhone(contact);
        const national = this.find(CheckoutPrefill.NATIONAL_FIELD);
        if (national) {
            const countryField = this.find(CheckoutPrefill.COUNTRY_CODE_FIELD);
            if (countryField && countryCode) this.setIfEmpty(countryField, countryCode);
            this.setIfEmpty(national, number);
            return;
        }
        const single = this.find(CheckoutPrefill.PHONE_FIELD);
        if (single) {
            this.setIfEmpty(single, countryCode ? `+${countryCode}${number}` : number);
        }
    }

    /** "+4712345678" with no separate code is kept whole as the number. */
    private splitPhone(contact: CheckoutContact): { countryCode: string | null; number: string } {
        const phone = contact.phone as string;
        if (!contact.phoneCountryCode) {
            return { countryCode: null, number: phone };
        }
        const code = contact.phoneCountryCode;
        const digits = phone.replace(/\D/g, "");
        const number = phone.startsWith("+") && digits.startsWith(code)
            ? digits.slice(code.length)
            : digits;
        return { countryCode: code, number };
    }

    private find(selector: string): HTMLInputElement | null {
        return document.querySelector<HTMLInputElement>(selector);
    }

    /**
     * Set a value the way typing does, so frameworks that track input
     * state (React's value tracker) see the change.
     */
    private setIfEmpty(field: HTMLInputElement, value: string): void {
        if (this.visitorFields.has(field)) {
            return;
        }
        if (field.value) {
            // A value we did not put there is the visitor's.
            if (!this.filledFields.has(field)) this.visitorFields.add(field);
            return;
        }
        this.filledFields.add(field);
        const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value",
        )?.set;
        if (setter) {
            setter.call(field, value);
        } else {
            field.value = value;
        }
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.dispatchEvent(new Event("change", { bubbles: true }));
    }
}
