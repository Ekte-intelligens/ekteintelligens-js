import { SDKOptions } from './types';
import { AbandonedCartTool } from './tools/abandoned-cart';

export declare class EkteIntelligensSDK {
    private options;
    private tools;
    private _isInitialized;
    constructor(options: SDKOptions);
    initialize(): Promise<boolean>;
    getAbandonedCartTool(): AbandonedCartTool | undefined;
    destroy(): void;
    isInitialized(): boolean;
}
//# sourceMappingURL=sdk.d.ts.map