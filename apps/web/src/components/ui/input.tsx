import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export function Input({
  className,
  suffix,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { suffix?: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-12 w-full items-center gap-2 rounded-lg border border-input bg-card px-3 shadow-xs transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30",
        "has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/20",
        className,
      )}
    >
      <input
        className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        {...props}
      />
      {suffix}
    </div>
  );
}
