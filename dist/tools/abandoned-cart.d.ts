import { SDKOptions } from '../types';

export declare class AbandonedCartTool {
    private options;
    private supabaseService;
    private inputDetector?;
    private productDetector?;
    private totalExtractor?;
    private _sessionId?;
    private isInitialized;
    constructor(options: SDKOptions);
    initialize(): Promise<boolean>;
    private handleContentUpdate;
    destroy(): void;
    getContent(): Record<string, any>;
    hasEmailOrPhone(): boolean;
    getSessionId(): string | undefined;
}
//# sourceMappingURL=abandoned-cart.d.ts.map