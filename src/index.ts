import { EkteIntelligensSDK } from "./sdk";

export { EkteIntelligensSDK } from "./sdk";
export type {
    SDKOptions,
    InputMapping,
    ProductMapping,
    CheckoutCampaign,
    Content,
    CartSessionPayload,
    CartSessionResponse,
    DetectedProduct,
} from "./types";

// Global initialization function for easy usage
declare global {
    interface Window {
        EkteIntelligensSDK: typeof EkteIntelligensSDK;
    }
}

// Make SDK available globally when loaded as a script
if (typeof window !== "undefined") {
    window.EkteIntelligensSDK = EkteIntelligensSDK;
}
