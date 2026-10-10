import { ChevronDown, X } from "lucide-react";

/**
 * A real PiggyLock screenshot shown the way it looks in use: an iPhone-style
 * device, the iOS status bar, and MiniPay's mini-app header above the app.
 * The light or dark capture follows the visitor's system theme, as does the
 * surrounding chrome.
 */
export function Phone({
  screen,
  alt,
  className = "",
}: {
  screen: "home" | "vault";
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative w-[300px] shrink-0 ${className}`}>
      {/* Side buttons */}
      <span aria-hidden className="absolute top-[108px] -left-[3px] h-7 w-[3px] rounded-l-sm bg-[#2b2d2a]" />
      <span aria-hidden className="absolute top-[152px] -left-[3px] h-12 w-[3px] rounded-l-sm bg-[#2b2d2a]" />
      <span aria-hidden className="absolute top-[208px] -left-[3px] h-12 w-[3px] rounded-l-sm bg-[#2b2d2a]" />
      <span aria-hidden className="absolute top-[170px] -right-[3px] h-[72px] w-[3px] rounded-r-sm bg-[#2b2d2a]" />

      {/* Body: black bezel inside a thin metal edge */}
      <div className="rounded-[50px] bg-[#0f100e] p-[3px] shadow-[0_0_0_1.5px_#3b3e3a,0_0_0_3px_#151614,0_30px_60px_-15px_rgb(0_0_0/0.35),0_18px_36px_-18px_rgb(0_0_0/0.3)]">
        <div className="relative flex aspect-[9/19.5] flex-col overflow-hidden rounded-[47px] bg-white dark:bg-black">
          {/* Dynamic Island */}
          <span aria-hidden className="absolute top-[12px] left-1/2 z-10 h-[27px] w-[88px] -translate-x-1/2 rounded-full bg-black" />

          <StatusBar />

          {/* MiniPay mini-app header */}
          <div aria-hidden className="flex h-10 shrink-0 items-center px-4 text-[#0d0e0c] dark:text-white">
            <X className="size-[18px]" strokeWidth={2.25} />
            <span className="flex flex-1 items-center justify-center gap-1 pr-[18px] text-[13px] font-semibold">
              PiggyLock <ChevronDown className="size-3.5" strokeWidth={2.5} />
            </span>
          </div>

          {/* The mini app itself, on MiniPay's rounded sheet */}
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-t-[18px] bg-[#f6f7f5] dark:bg-[#0b0c0a]">
            <picture>
              <source srcSet={`/screens/${screen}-dark.png`} media="(prefers-color-scheme: dark)" />
              <img
                src={`/screens/${screen}-light.png`}
                alt={alt}
                width={780}
                height={1480}
                className="block h-full w-full object-cover object-top"
              />
            </picture>
          </div>

          {/* Home indicator */}
          <span aria-hidden className="absolute bottom-[7px] left-1/2 h-[4px] w-[104px] -translate-x-1/2 rounded-full bg-black/85 dark:bg-white/85" />
        </div>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div aria-hidden className="flex h-[46px] shrink-0 items-center justify-between pr-[22px] pl-[30px] pt-[6px] text-[#0d0e0c] dark:text-white">
      <span className="text-[14px] font-semibold tracking-tight">9:41</span>
      <span className="flex items-center gap-[5px]">
        {/* Signal */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="0.8" />
          <rect x="4.6" y="5" width="3" height="6" rx="0.8" />
          <rect x="9.2" y="2.6" width="3" height="8.4" rx="0.8" />
          <rect x="13.8" y="0" width="3" height="11" rx="0.8" />
        </svg>
        {/* Wi-Fi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
          <path d="M7.5 2.3c2.1 0 4 .8 5.4 2.1l1.1-1.1A9.2 9.2 0 0 0 7.5.7 9.2 9.2 0 0 0 1 3.3l1.1 1.1a7.6 7.6 0 0 1 5.4-2.1Z" />
          <path d="M7.5 5.5c1.2 0 2.3.5 3.2 1.2l1.1-1.1A6.2 6.2 0 0 0 7.5 3.9c-1.7 0-3.2.6-4.3 1.7l1.1 1.1a4.6 4.6 0 0 1 3.2-1.2Z" />
          <path d="M7.5 8.6c.4 0 .8.2 1 .4L7.5 10.1 6.5 9c.3-.2.6-.4 1-.4Z" />
        </svg>
        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" />
          <path d="M23 4v4c.8-.3 1.3-1.1 1.3-2S23.8 4.3 23 4Z" fill="currentColor" opacity="0.45" />
        </svg>
      </span>
    </div>
  );
}
