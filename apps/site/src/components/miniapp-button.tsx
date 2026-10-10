import { ArrowUpRight } from "lucide-react";
import { getMiniPayUrl, openInMiniPayUrl } from "@/lib/config";

const base =
  "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Primary call to action: open the mini app, or say it's coming soon. */
export function MiniAppButton({ inverted = false }: { inverted?: boolean }) {
  const primary = inverted
    ? "bg-white text-hero-to hover:bg-white/90"
    : "bg-primary text-primary-foreground hover:bg-primary/90";

  if (openInMiniPayUrl) {
    return (
      <a href={openInMiniPayUrl} className={`${base} ${primary}`}>
        Open in MiniPay <ArrowUpRight className="size-4" />
      </a>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span
        className={`${base} cursor-default ${
          inverted ? "bg-white/15 text-white" : "bg-accent text-accent-foreground"
        }`}
      >
        Coming soon to MiniPay
      </span>
      <a
        href={getMiniPayUrl}
        className={`${base} ${
          inverted
            ? "border border-white/30 text-white hover:bg-white/10"
            : "border border-input bg-card hover:bg-muted"
        }`}
      >
        Get MiniPay <ArrowUpRight className="size-4" />
      </a>
    </div>
  );
}
