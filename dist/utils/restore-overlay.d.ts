/**
 * The full-page "restoring your booking" overlay and the outcome banners
 * shown by cart restore. Styled inline so it renders the same on every
 * booking engine theme, from phone width up.
 */
export declare class RestoreOverlay {
    private static readonly STYLE_ID;
    private static readonly Z_INDEX;
    private overlay?;
    private banners;
    showLoading(text: string, closeLabel: string, onClose: () => void): void;
    hideLoading(): void;
    isLoadingVisible(): boolean;
    showBanner(text: string, closeLabel: string): void;
    destroy(): void;
    private closeButton;
    private ensureStyle;
}
//# sourceMappingURL=restore-overlay.d.ts.map