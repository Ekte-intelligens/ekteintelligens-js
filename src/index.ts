import { EkteIntelligensSDK } from "./sdk";
import { version as SDK_VERSION } from "../package.json";

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
    StayParams,
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
    // Lets us see in the console which build a visitor actually got
    console.log(`EI SDK ${SDK_VERSION} loaded`, {
        path: window.location.pathname,
    });
}
