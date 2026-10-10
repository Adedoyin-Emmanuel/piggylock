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

export const githubUrl = "https://github.com/Adedoyin-Emmanuel/piggylock";
export const authorUrl = "https://adedoyin.dev";
export const authorName = "Adedoyin Emmanuel";

export const siteUrl = "https://piggylock.adedoyin.dev";

export const socials = {
  x: "https://x.com/Emmysoft_Tm",
  instagram: "https://www.instagram.com/heyemmysoft",
  linkedin: "https://www.linkedin.com/in/Adedoyin-Emmanuel",
};
