import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/** One label/value line in a definition list (`<dl>`). */
export function DetailRow({
  label,
  value,
  strong,
}: {
  label: ReactNode;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="min-w-0 text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-right whitespace-nowrap tabular-nums",
          strong ? "text-base font-bold" : "text-sm font-medium",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
