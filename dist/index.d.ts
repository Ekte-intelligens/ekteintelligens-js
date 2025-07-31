import { EkteIntelligensSDK } from './sdk';

export { EkteIntelligensSDK } from './sdk';
export type { SDKOptions, InputMapping, ProductMapping, CheckoutCampaign, Content, CartSessionPayload, CartSessionResponse, DetectedProduct, } from './types';
declare global {
    interface Window {
        EkteIntelligensSDK: typeof EkteIntelligensSDK;
    }
}
//# sourceMappingURL=index.d.ts.map