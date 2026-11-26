/**
 * The full-page "restoring your booking" overlay and the outcome banners
 * shown by cart restore. Styled inline so it renders the same on every
 * booking engine theme, from phone width up.
 */
export class RestoreOverlay {
    private static readonly STYLE_ID = "ei-restore-style";
    private static readonly Z_INDEX = "2147483646";

    private overlay?: HTMLElement;
    private banners: HTMLElement[] = [];

    public showLoading(text: string, closeLabel: string, onClose: () => void): void {
        if (typeof document === "undefined" || this.overlay) {
            return;
        }
        this.ensureStyle();

        const overlay = document.createElement("div");
        overlay.setAttribute("data-ei-restore-overlay", "");
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-busy", "true");
        overlay.style.cssText = [
            "position:fixed",
            "inset:0",
            `z-index:${RestoreOverlay.Z_INDEX}`,
            "display:flex",
            "flex-direction:column",
            "align-items:center",
            "justify-content:center",
            "gap:16px",
            "padding:24px",
            "box-sizing:border-box",
            "background:rgba(255,255,255,0.94)",
            "font-family:inherit",
            "color:#1a1a1a",
            "text-align:center",
        ].join(";");

        const spinner = document.createElement("div");
        spinner.setAttribute("aria-hidden", "true");
        spinner.style.cssText =
            "width:40px;height:40px;border-radius:50%;border:4px solid rgba(0,0,0,0.12);border-top-color:currentColor;animation:ei-restore-spin 0.9s linear infinite";

        const message = document.createElement("p");
        message.setAttribute("data-ei-restore-text", "");
        message.setAttribute("role", "status");
        message.style.cssText = "margin:0;font-size:16px;line-height:1.4;max-width:420px";
        message.textContent = text;

        const close = this.closeButton(closeLabel, onClose);
        close.style.position = "absolute";
        close.style.top = "8px";
        close.style.right = "8px";

        overlay.append(spinner, message, close);
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    public hideLoading(): void {
        this.overlay?.remove();
        this.overlay = undefined;
    }

    public isLoadingVisible(): boolean {
        return !!this.overlay?.isConnected;
    }

    public showBanner(text: string, closeLabel: string): void {
        if (typeof document === "undefined") {
            return;
        }
        const banner = document.createElement("div");
        banner.setAttribute("data-ei-restore-banner", "");
        banner.setAttribute("role", "alert");
        banner.style.cssText = [
            "position:fixed",
            `top:${12 + this.banners.length * 8}px`,
            "left:50%",
            "transform:translateX(-50%)",
            `z-index:${RestoreOverlay.Z_INDEX}`,
            "width:calc(100% - 24px)",
            "max-width:560px",
            "box-sizing:border-box",
            "display:flex",
            "align-items:flex-start",
            "gap:12px",
            "padding:14px 16px",
            "border-radius:8px",
            "background:#ffffff",
            "color:#1a1a1a",
            "box-shadow:0 4px 18px rgba(0,0,0,0.18)",
            "font-family:inherit",
            "font-size:15px",
            "line-height:1.4",
        ].join(";");

        const message = document.createElement("p");
        message.style.cssText = "margin:0;flex:1";
        message.textContent = text;

        const close = this.closeButton(closeLabel, () => {
            banner.remove();
            this.banners = this.banners.filter((item) => item !== banner);
        });
        banner.append(message, close);
        document.body.appendChild(banner);
        this.banners.push(banner);
    }

    public destroy(): void {
        this.hideLoading();
        this.banners.forEach((banner) => banner.remove());
        this.banners = [];
    }

    private closeButton(label: string, onClose: () => void): HTMLButtonElement {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("data-ei-restore-close", "");
        button.setAttribute("aria-label", label);
        button.textContent = "×";
        button.style.cssText =
            "min-width:44px;min-height:44px;border:0;background:transparent;color:inherit;font-size:24px;line-height:1;cursor:pointer";
        button.addEventListener("click", onClose);
        return button;
    }

    private ensureStyle(): void {
        if (document.getElementById(RestoreOverlay.STYLE_ID)) {
            return;
        }
        const style = document.createElement("style");
        style.id = RestoreOverlay.STYLE_ID;
        style.textContent =
            "@keyframes ei-restore-spin{to{transform:rotate(360deg)}}";
        document.head.appendChild(style);
    }
}
