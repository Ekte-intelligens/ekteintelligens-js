import { SDKOptions } from "./types";
import { AbandonedCartTool } from "./tools/abandoned-cart";

export class EkteIntelligensSDK {
    private options: SDKOptions;
    private tools: Map<string, any> = new Map();
    private _isInitialized = false;

    constructor(options: SDKOptions) {
        this.options = options;
    }

    async initialize(): Promise<boolean> {
        if (this._isInitialized) {
            return true;
        }

        try {
            // Initialize enabled features
            if (this.options.features?.abandonedCart) {
                const abandonedCartTool = new AbandonedCartTool(this.options);
                await abandonedCartTool.initialize();
                this.tools.set("abandonedCart", abandonedCartTool);
            }

            this._isInitialized = true;
            // console.log("EkteIntelligens SDK initialized successfully");
            return true;
        } catch (error) {
            // console.error("Failed to initialize EkteIntelligens SDK:", error);
            return false;
        }
    }

    // Public API methods
    public getAbandonedCartTool(): AbandonedCartTool | undefined {
        return this.tools.get("abandonedCart");
    }

    public destroy(): void {
        this.tools.forEach((tool) => {
            if (tool.destroy) {
                tool.destroy();
            }
        });
        this.tools.clear();
        this._isInitialized = false;
    }

    public isInitialized(): boolean {
        return this._isInitialized;
    }
}
