/**
 * Asset manifest for the bundle builder (Figma: "Bundle Builder", node 68:8088).
 *
 * Maps every extracted image in `public/assets/bundle-builder/` to where it
 * appears in the design. Camera images show up twice: as the product-card
 * photo in step 1 and as the row thumbnail in the "Your security system"
 * summary panel. Swatch images only exist at 48x48 in the design — use them
 * for color-variant dots, not card photos. 
 */
 
interface BundleBuilderAsset {
  src: string;
  alt: string; 
  /** Where this image appears in the bundle builder UI. */
  usedIn: string;
}

export const BUNDLE_BUILDER_ASSETS = {
  // Step 1 — "Choose your cameras" product cards (+ summary panel thumbs)
  camV4: {
    src: "/assets/bundle-builder/products/wyze-cam-v4.png",
    alt: "Wyze Cam v4",
    usedIn:
      "Cameras step: Wyze Cam v4 card photo (White variant); summary panel: Cameras row thumbnail",
  },
  camV4White: {
    src: "/assets/bundle-builder/products/wyze-cam-v4-white.png",
    alt: "Wyze Cam v4, white",
    usedIn: "Cameras step: Wyze Cam v4 card, 'White' color swatch",
  },
  camV4Grey: {
    src: "/assets/bundle-builder/products/wyze-cam-v4-grey.png",
    alt: "Wyze Cam v4, grey",
    usedIn: "Cameras step: Wyze Cam v4 card, 'Grey' color swatch",
  },
  camV4Black: {
    src: "/assets/bundle-builder/products/wyze-cam-v4-black.png",
    alt: "Wyze Cam v4, black",
    usedIn: "Cameras step: Wyze Cam v4 card, 'Black' color swatch",
  },
  camPanV3: {
    src: "/assets/bundle-builder/products/wyze-cam-pan-v3.png",
    alt: "Wyze Cam Pan v3",
    usedIn:
      "Cameras step: Wyze Cam Pan v3 card photo; summary panel: Cameras row thumbnail",
  },
  camPanV3White: {
    src: "/assets/bundle-builder/products/wyze-cam-pan-v3-white.png",
    alt: "Wyze Cam Pan v3, white",
    usedIn: "Cameras step: Wyze Cam Pan v3 card, 'White' color swatch",
  },
  camPanV3Black: {
    src: "/assets/bundle-builder/products/wyze-cam-pan-v3-black.png",
    alt: "Wyze Cam Pan v3, black",
    usedIn: "Cameras step: Wyze Cam Pan v3 card, 'Black' color swatch",
  },
  camFloodlightV2: {
    src: "/assets/bundle-builder/products/wyze-cam-floodlight-v2.png",
    alt: "Wyze Cam Floodlight v2",
    usedIn:
      "Cameras step: Wyze Cam Floodlight v2 card photo; the design reuses it for the 'White' color swatch",
  },
  camFloodlightV2Black: {
    src: "/assets/bundle-builder/products/wyze-cam-floodlight-v2-black.png",
    alt: "Wyze Cam Floodlight v2, black",
    usedIn: "Cameras step: Wyze Cam Floodlight v2 card, 'Black' color swatch",
  },
  duoCamDoorbell: {
    src: "/assets/bundle-builder/products/wyze-duo-cam-doorbell.png",
    alt: "Wyze Duo Cam Doorbell",
    usedIn:
      "Cameras step: Wyze Duo Cam Doorbell card photo (no color swatches)",
  },
  batteryCamPro: {
    src: "/assets/bundle-builder/products/wyze-battery-cam-pro.png",
    alt: "Wyze Battery Cam Pro",
    usedIn:
      "Cameras step: Wyze Battery Cam Pro card photo; the design reuses it for the 'White' color swatch",
  },
  batteryCamProBlack: {
    src: "/assets/bundle-builder/products/wyze-battery-cam-pro-black.png",
    alt: "Wyze Battery Cam Pro, black",
    usedIn: "Cameras step: Wyze Battery Cam Pro card, 'Black' color swatch",
  },

  // Step 3 — sensors (collapsed in the design; images appear in the summary panel)
  senseMotionSensor: {
    src: "/assets/bundle-builder/products/wyze-sense-motion-sensor.png",
    alt: "Wyze Sense Motion Sensor",
    usedIn: "Summary panel: Sensors row thumbnail (Wyze Sense Motion Sensor)",
  },
  senseHub: {
    src: "/assets/bundle-builder/products/wyze-sense-hub.png",
    alt: "Wyze Sense Hub",
    usedIn: "Summary panel: Sensors row thumbnail (Wyze Sense Hub, Required)",
  },

  // Step 4 — accessories (collapsed in the design; image appears in the summary panel)
  microSdCard256Gb: {
    src: "/assets/bundle-builder/products/wyze-microsd-card-256gb.png",
    alt: "Wyze 256GB MicroSD card",
    usedIn:
      "Summary panel: Accessories row thumbnail (Wyze MicroSD Card 256GB)",
  },

  // Summary panel
  satisfactionBadge: {
    src: "/assets/bundle-builder/badges/satisfaction-guarantee.png",
    alt: "100% Wyze satisfaction guarantee — try worry-free for 30 days",
    usedIn:
      "Summary panel: '30-day hassle-free returns' callout, starburst badge",
  },
} as const satisfies Record<string, BundleBuilderAsset>;
