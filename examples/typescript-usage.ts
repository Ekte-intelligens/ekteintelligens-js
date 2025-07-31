import { EkteIntelligensSDK, SDKOptions } from "ekteintelligens-sdk";

// Configuration
const options: SDKOptions = {
    organizationId: "your-org-id",
    cartCampaignId: "your-campaign-id",
    // Supabase credentials are optional - SDK uses our backend by default
    features: {
        abandonedCart: true,
    },
};

// Initialize SDK
async function initializeSDK() {
    try {
        const sdk = new EkteIntelligensSDK(options);
        const success = await sdk.initialize();

        if (success) {
            console.log("SDK initialized successfully");

            // Get the abandoned cart tool
            const abandonedCartTool = sdk.getAbandonedCartTool();
            if (abandonedCartTool) {
                console.log("Abandoned cart tool is ready");

                // Monitor content changes
                setInterval(() => {
                    const content = abandonedCartTool.getContent();
                    const hasContact = abandonedCartTool.hasEmailOrPhone();

                    if (Object.keys(content).length > 0) {
                        console.log("Current content:", content);
                        console.log("Has email or phone:", hasContact);
                    }
                }, 5000); // Check every 5 seconds
            }

            return sdk;
        } else {
            console.error("Failed to initialize SDK");
            return null;
        }
    } catch (error) {
        console.error("Error initializing SDK:", error);
        return null;
    }
}

// Cleanup function
function cleanup(sdk: EkteIntelligensSDK) {
    sdk.destroy();
    console.log("SDK cleaned up");
}

// Usage example
async function main() {
    const sdk = await initializeSDK();

    if (sdk) {
        // Your application logic here

        // Example: Clean up when page unloads
        window.addEventListener("beforeunload", () => {
            cleanup(sdk);
        });
    }
}

// Run the example
main().catch(console.error);
