const ASSET_BASE = "/assets/bundle-builder";

export const PATHS = {
  product: (file: string) => `${ASSET_BASE}/products/${file}`,
  badge: (file: string) => `${ASSET_BASE}/badges/${file}`,
};
