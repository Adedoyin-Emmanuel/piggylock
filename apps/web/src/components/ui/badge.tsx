import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const badgeVariants = {
  success: "bg-accent text-accent-foreground",
  secondary: "bg-secondary text-muted-foreground",
  outline: "border text-muted-foreground",
  warning: "bg-warning-bg text-warning",
};

export function Badge({
  variant = "secondary",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof badgeVariants }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&>svg]:size-3",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
