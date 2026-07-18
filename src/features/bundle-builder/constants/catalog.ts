import { PATHS } from "../lib/paths";
import { Catalog, Category } from "../types";

export const cameras: Category = {
  id: "cameras",
  step: 1,
  stepTitle: "Choose your cameras",
  reviewLabel: "Cameras",
  reviewOrder: 1,
  products: [
    {
      id: "cam-v4",
      title: "Wyze Cam v4",
      tagline: "The clearest Wyze Cam ever made.",
      image: PATHS.product("wyze-cam-v4.png"),
      price: 2798,
      compareAt: 3598, //=> "Save 22%" (floor(800/3598*100)) + strikethrough
      // prettier-ignore
      variants: [
        { id: "cam-v4-white", label: "White", swatch: PATHS.product("wyze-cam-v4-white.png") },
        { id: "cam-v4-grey", label: "Grey", swatch: PATHS.product("wyze-cam-v4-grey.png") },
        { id: "cam-v4-black", label: "Black", swatch: PATHS.product("wyze-cam-v4-black.png") },
      ],
    },

    {
      id: "cam-pan-v3",
      title: "Wyze Cam Pan v3",
      tagline: "360° pan and 180° tilt security camera.",
      image: PATHS.product("wyze-cam-pan-v3.png"),
      price: 3498,
      compareAt: 3998, // => "Save 12%" (floor(500/3998*100) = 12, not round's 13)
      // prettier-ignore
      variants: [
        { id: "cam-pan-v3-white", label: "White", swatch: PATHS.product("wyze-cam-pan-v3-white.png") },
        { id: "cam-pan-v3-black", label: "Black", swatch: PATHS.product("wyze-cam-pan-v3-black.png") },
      ],
    },

    {
      id: "cam-floodlight-v2",
      title: "Wyze Cam Floodlight v2",
      tagline:
        "2K floodlight camera with a 160° wide-angle view for your garage.",
      image: PATHS.product("wyze-cam-floodlight-v2.png"),
      price: 6998,
      compareAt: 8998, // => save 22%
      // prettier-ignore
      variants: [
        { id: "cam-floodlight-v2-white", label: "White", swatch: PATHS.product("wyze-cam-floodlight-v2.png") },
        { id: "cam-floodlight-v2-black", label: "Black", swatch: PATHS.product("wyze-cam-floodlight-v2-black.png") },
      ],
    },

    {
      id: "duo-cam-doorbell",
      title: "Wyze Duo Cam Doorbell",
      tagline: "Two cameras. Two views. Double the porch protection.",
      image: PATHS.product("wyze-duo-cam-doorbell.png"),
      price: 6998, // no compareAt ⇒ no badge, no strikethrough
      // prettier-ignore
      variants: [
        { id: "duo-cam-doorbell", label: "", swatch: "" }, // single unit; selector hidden (length === 1)
      ],
    },

    {
      id: "battery-cam-pro",
      title: "Wyze Battery Cam Pro",
      tagline:
        "Protect anywhere. See everything in 2.5K HDR. No power outlet or electrician needed.",
      image: PATHS.product("wyze-battery-cam-pro.png"),
      price: 8998, // no compareAt ⇒ plain price
      // prettier-ignore
      variants: [
        { id: "battery-cam-pro-white", label: "White", swatch: PATHS.product("wyze-battery-cam-pro.png") },
        { id: "battery-cam-pro-black", label: "Black", swatch: PATHS.product("wyze-battery-cam-pro-black.png") },
      ],
    },
  ],
};

export const plan: Category = {
  id: "plan",
  step: 2,
  stepTitle: "Choose your plan",
  reviewLabel: "Plan",
  reviewOrder: 4,
  singleSelect: true,
  products: [
    {
      id: "cam-unlimited",
      title: "Cam Unlimited",
      tagline:
        "Unlimited cloud recording and 24/7 monitoring for every camera.", // inferred copy
      image: PATHS.product("cam-unlimited.svg"),
      price: 999,
      compareAt: 1299, // $12.99 -> $9.99/mo
      unit: "month",
      variants: [{ id: "cam-unlimited", label: "", swatch: "" }],
    },
    {
      id: "free-plan",
      title: "Free",
      tagline: "Rolling 12-second event clips. No subscription.", // inferred copy
      price: 0,
      unit: "month",
      variants: [{ id: "free-plan", label: "", swatch: "" }],
    },
  ],
};

export const sensors: Category = {
  id: "sensors",
  step: 3,
  stepTitle: "Choose your sensors",
  reviewLabel: "Sensors",
  reviewOrder: 2,
  products: [
    {
      id: "sense-motion-sensor",
      title: "Wyze Sense Motion Sensor",
      tagline: "Detects movement and triggers instant alerts.", // inferred copy
      image: PATHS.product("wyze-sense-motion-sensor.png"),
      price: 2999, // no compareAt ⇒ plain price
      variants: [{ id: "sense-motion-sensor", label: "", swatch: "" }],
    },
    {
      id: "sense-hub",
      title: "Wyze Sense Hub",
      tagline: "The brain of your system — connects and powers every sensor.", // inferred copy
      image: PATHS.product("wyze-sense-hub.png"),
      price: 0, // FREE
      compareAt: 2992, // shows $29.92 struck through, then "FREE"
      required: true, // min qty 1, minus disabled
      max: 1, // one hub runs the whole system; a second is not a real purchase
      variants: [{ id: "sense-hub", label: "", swatch: "" }],
    },
  ],
};

export const extraProtection: Category = {
  id: "extra-protection",
  step: 4,
  stepTitle: "Add extra protection",
  reviewLabel: "Accessories",
  reviewOrder: 3,
  products: [
    {
      id: "microsd-256gb",
      title: "Wyze MicroSD Card (256GB)",
      tagline: "Local backup so your footage survives wifi and cloud outages.", // inferred copy
      image: PATHS.product("wyze-microsd-card-256gb.png"),
      price: 2098, // ×2 = $41.96
      variants: [{ id: "microsd-256gb", label: "", swatch: "" }],
    },
  ],
};

export const CATALOG: Catalog = [cameras, plan, sensors, extraProtection];
