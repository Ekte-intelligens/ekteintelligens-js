import { SupabaseService } from "../services/supabase-service";
import { CheckoutPrefill } from "../utils/checkout-prefill";
import { InputDetector } from "../utils/input-detector";
import { SearchEmailMessages } from "../utils/search-email-messages";
import { SDKOptions } from "../types";

/**
 * Adds an email field to BookVisit's search box, between the guest picker
 * and the "I have a code" / "Search" row, styled like the guest picker. The
 * email is kept for the browser session and filled into the checkout form
 * once it renders, the way cart restore fills a saved contact.
 *
 * BookVisit re-renders the search box and navigates between steps without
 * a page load, so the page is watched: the field is put back whenever the
 * search box is rendered again, and a checkout email field that appears is
 * filled.
 *
 * Runs only when both `features.searchEmail` and the campaign's
 * `config.bookvisit.search_email` are on.
 */
export class SearchEmailTool {
    private static readonly FIELD_ATTRIBUTE = "data-ei-search-email";
    private static readonly STORAGE_KEY = "ei_search_email";
    private static readonly STYLE_ID = "ei-search-email-style";
    private static readonly SEARCH_BOX_ID = "calendarInnerWrapper";
    private static readonly SEARCH_BUTTON = '[data-testid="search_button"]';
    private static readonly CHECKOUT_PATH = /\/checkout(\/|$)/;
    /** The guest picker's classes, which BookVisit's stylesheet already has. */
    private static readonly FIELD_CLASS =
        "sm:w-full bv:flex bv:min-h-[40px] bv:w-full bv:grid-cols-[max-content_1fr] bv:content-center bv:items-center bv:whitespace-nowrap bv:rounded-bv_inputRoundedCorners bv:border-bv_inputBorderWidth bv:border-solid bv:border-bv_formBorderColor bv:bg-bv_formBackground bv:px-[10px] bv:py-[5px] bv:text-left bv:font-bv_bodyFontFamily bv:text-bv_bodyFontSize bv:leading-bv_bodyLineHeight bv:text-bv_formColor bv:shadow-bv_inputTextBoxShadow bv:transition-[filter,background] bv:duration-200 bv:bv_small:w-full bv:hover:border-bv_inputBorderWidth! bv:hover:border-bv_inputBorderColor! bv:hover:bg-bv_formBackground! bv:hover:text-bv_formColor! bv:bv_large:mt-[20px]";
    private static readonly INPUT_STYLE = [
        "flex:1 1 auto",
        "min-width:0",
        "width:100%",
        "height:auto",
        "margin:0",
        "padding:0 0 0 8px",
        "border:0",
        "border-radius:0",
        "background:transparent",
        "box-shadow:none",
        "outline:none",
        "color:inherit",
        "font:inherit",
    ].join(";");
    private static readonly CSS =
        `[${SearchEmailTool.FIELD_ATTRIBUTE}]{cursor:text}` +
        `[${SearchEmailTool.FIELD_ATTRIBUTE}]:focus-within{outline:2px solid currentColor;outline-offset:-2px}` +
        `[${SearchEmailTool.FIELD_ATTRIBUTE}] input::placeholder{color:inherit;opacity:0.7}`;
    /** Font Awesome's regular envelope, like the guest picker's user icon. */
    private static readonly ICON =
        '<svg data-prefix="far" data-icon="envelope" class="svg-inline--fa fa-envelope bv:text-[18px] bv:opacity-60" role="img" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M64 112c-8.8 0-16 7.2-16 16l0 22.1L220.5 291.7c20.7 17 50.4 17 71.1 0L464 150.1l0-22.1c0-8.8-7.2-16-16-16L64 112zM48 212.2L48 384c0 8.8 7.2 16 16 16l384 0c8.8 0 16-7.2 16-16l0-171.8L322 328.8c-38.4 31.5-93.7 31.5-132 0L48 212.2zM0 128C0 92.7 28.7 64 64 64l384 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128z"></path></svg>';

    private options: SDKOptions;
    private supabaseService: SupabaseService;
    private prefill = new CheckoutPrefill();
    /** Kept while off the page, so a typed value survives a re-render. */
    private field?: HTMLLabelElement;
    private observer?: MutationObserver;
    private filledCheckoutField?: HTMLInputElement;
    private isInitialized = false;

    constructor(options: SDKOptions) {
        this.options = options;
        this.supabaseService = new SupabaseService(
            options.supabaseUrl,
            options.supabaseAnonKey,
        );
    }

    async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            return true;
        }
        this.isInitialized = true;
        if (typeof window === "undefined" || typeof MutationObserver === "undefined") {
            return true;
        }
        if (!(await this.isEnabled()) || !this.isInitialized) {
            return true;
        }

        this.field = this.createField();
        this.observer = new MutationObserver(() => this.sync());
        this.observer.observe(document.body, { childList: true, subtree: true });
        this.sync();
        return true;
    }

    public destroy(): void {
        this.observer?.disconnect();
        this.observer = undefined;
        this.field?.remove();
        this.field = undefined;
        this.filledCheckoutField = undefined;
        this.prefill.destroy();
        this.isInitialized = false;
    }

    private async isEnabled(): Promise<boolean> {
        if (this.options.features?.searchEmail !== true) {
            return false;
        }
        const campaign = await this.supabaseService.getCheckoutCampaign(
            this.options.checkoutCampaignId,
        );
        return (
            campaign?.type === "bookvisit" &&
            campaign.config?.bookvisit?.search_email === true
        );
    }

    private sync(): void {
        this.placeField();
        this.fillCheckout();
    }

    /** Right above the row holding the search button. */
    private placeField(): void {
        const field = this.field;
        const box = document.getElementById(SearchEmailTool.SEARCH_BOX_ID);
        const button = box?.querySelector(SearchEmailTool.SEARCH_BUTTON);
        if (!field || !box || !button) {
            return;
        }
        let row: Element = button;
        while (row.parentElement && row.parentElement !== box) {
            row = row.parentElement;
        }
        if (field.parentElement !== box || field.nextElementSibling !== row) {
            box.insertBefore(field, row);
        }
    }

    /** Each checkout email field BookVisit renders is filled once. */
    private fillCheckout(): void {
        if (!SearchEmailTool.CHECKOUT_PATH.test(window.location.pathname)) {
            return;
        }
        const target = document.querySelector<HTMLInputElement>(
            CheckoutPrefill.EMAIL_FIELD,
        );
        if (!target || target === this.filledCheckoutField) {
            return;
        }
        const email = this.storedEmail();
        if (!email) {
            return;
        }
        this.filledCheckoutField = target;
        this.prefill.fill({ email });
    }

    /**
     * Not `type="email"`, so neither our checkout prefill nor BookVisit's
     * form code mistakes it for the checkout email field.
     */
    private createField(): HTMLLabelElement {
        this.ensureStyle();
        const label = SearchEmailMessages.get("email");
        const field = document.createElement("label");
        field.setAttribute(SearchEmailTool.FIELD_ATTRIBUTE, "");
        // No cart exists yet at search, so the address is not uploaded from here.
        field.setAttribute(InputDetector.NO_CAPTURE_ATTRIBUTE, "");
        field.className = SearchEmailTool.FIELD_CLASS;
        field.innerHTML = SearchEmailTool.ICON;

        const input = document.createElement("input");
        input.type = "text";
        input.name = "ei-search-email";
        input.inputMode = "email";
        input.autocomplete = "email";
        input.spellcheck = false;
        input.setAttribute("autocapitalize", "off");
        input.setAttribute("aria-label", label);
        input.placeholder = label;
        input.style.cssText = SearchEmailTool.INPUT_STYLE;
        input.value = this.storedEmail() ?? "";
        input.addEventListener("input", () => this.storeEmail(input.value));
        field.appendChild(input);
        return field;
    }

    private storedEmail(): string | null {
        try {
            const stored = sessionStorage.getItem(SearchEmailTool.STORAGE_KEY);
            return CheckoutPrefill.clean(stored, null, null)?.email ?? null;
        } catch {
            return null;
        }
    }

    /** Only a complete address is kept; clearing the field forgets it. */
    private storeEmail(value: string): void {
        const email = CheckoutPrefill.clean(value, null, null)?.email;
        try {
            if (email) {
                sessionStorage.setItem(SearchEmailTool.STORAGE_KEY, email);
            } else {
                sessionStorage.removeItem(SearchEmailTool.STORAGE_KEY);
            }
        } catch (error) {
            console.warn("Failed to persist search email:", error);
        }
    }

    private ensureStyle(): void {
        if (document.getElementById(SearchEmailTool.STYLE_ID)) {
            return;
        }
        const style = document.createElement("style");
        style.id = SearchEmailTool.STYLE_ID;
        style.textContent = SearchEmailTool.CSS;
        document.head.appendChild(style);
    }
}
