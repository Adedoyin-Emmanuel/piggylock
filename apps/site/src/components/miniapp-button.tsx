import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getMiniPayUrl, openInMiniPayUrl } from "@/lib/config";

const base =
  "inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 text-[15px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-12 sm:px-5 sm:text-base";

/** Primary call to action: open the mini app, or say it's coming soon. */
export function MiniAppButton({ inverted = false, center = false }: { inverted?: boolean; center?: boolean }) {
  const primary = inverted
    ? "bg-white text-hero-to hover:bg-white/90"
    : "bg-primary text-primary-foreground hover:bg-primary/90";
  const arrow = <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-4" />;

  if (openInMiniPayUrl) {
    return (
      <a href={openInMiniPayUrl} className={`${base} ${primary}`}>
        Open in MiniPay {arrow}
      </a>
    );
  }
  // Both buttons stay on one row, even on small phones: the label shortens
  // based on the space its container actually has (container query).
  return (
    <div className="@container w-full">
    <div className={`flex flex-nowrap items-center gap-2.5 sm:gap-3 ${center ? "justify-center" : ""}`}>
      <span
        className={`${base} cursor-default ${
          inverted ? "bg-white/15 text-white" : "bg-accent text-accent-foreground"
        }`}
      >
        <span>
          Coming soon<span className="hidden @min-[370px]:inline"> to MiniPay</span>
        </span>
      </span>
      <a
        href={getMiniPayUrl}
        className={`${base} ${
          inverted
            ? "border border-white/30 text-white hover:bg-white/10"
            : "border border-input bg-card hover:bg-muted"
        }`}
      >
        Get MiniPay {arrow}
      </a>
    </div>
    </div>
  );
}
