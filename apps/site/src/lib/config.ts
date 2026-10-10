/**
 * Set NEXT_PUBLIC_MINIPAY_APP_ID to PiggyLock's MiniPay Discover listing ID
 * once it's approved. Until then the site shows "Coming soon to MiniPay".
 */
const appId = process.env.NEXT_PUBLIC_MINIPAY_APP_ID;

/** Opens PiggyLock inside MiniPay (official MiniPay deeplink). */
export const openInMiniPayUrl = appId
  ? `https://link.minipay.xyz/miniapp?id=${encodeURIComponent(appId)}`
  : undefined;

export const getMiniPayUrl = "https://www.minipay.to";
