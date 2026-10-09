import { Check } from "lucide-react";
import type { ReactNode } from "react";

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg py-1">
      <span className="relative mt-0.5 flex size-5 shrink-0">
        <input
          type="checkbox"
          className="peer size-5 cursor-pointer appearance-none rounded-[5px] border border-input bg-card shadow-xs transition-colors checked:border-primary checked:bg-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <Check
          aria-hidden
          strokeWidth={3}
          className="pointer-events-none absolute inset-0.5 size-4 text-primary-foreground opacity-0 peer-checked:opacity-100"
        />
      </span>
      <span className="text-sm leading-relaxed">{children}</span>
    </label>
  );
}
