import { CartRestoreNotice } from '../types';

type MessageKey = "restoring" | "close" | "priceChanged" | "promoApplied" | "unavailable" | "failed";
/** All text shown by cart restore. `{name}` placeholders are filled in. */
export declare class RestoreMessages {
    private static readonly TEXT;
    private static readonly LOCALE_ALIASES;
    static get(key: MessageKey): string;
    static forNotice(notice: CartRestoreNotice): string;
    private static locale;
    private static formatMoney;
}
export {};
//# sourceMappingURL=restore-messages.d.ts.map