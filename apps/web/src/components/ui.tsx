import { Check, ChevronLeft, LoaderCircle } from "lucide-react";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "../lib/cn";

// Small shadcn/ui-inspired primitives. Kept local and dependency-free
// (no Radix / class-variance-authority) because the app only needs a handful.

/* ------------------------------------------------------------------ Button */

const buttonVariants = {
  default:
    "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/85",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline:
    "border border-input bg-card text-foreground shadow-xs hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
};
const buttonSizes = {
  default: "h-12 px-5 text-base",
  sm: "h-9 px-3 text-sm",
  icon: "size-11",
};

export function Button({
  variant = "default",
  size = "default",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-[color,background-color,box-shadow,opacity] outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------- Card */

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------- Badge */

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

/* ---------------------------------------------------------------- Skeleton */

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------ Form fields */

export function Label({
  children,
  htmlFor,
  hint,
}: {
  children: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {children}
      </label>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

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

/* ----------------------------------------------------------------- Layout */

export function Separator({ className }: { className?: string }) {
  return <div role="separator" className={cn("h-px w-full bg-border", className)} />;
}

export function Row({
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

/** Mobile page shell with a sticky header. Respects device safe areas. */
export function Screen({
  title,
  onBack,
  actions,
  children,
}: {
  title: ReactNode;
  onBack?: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  if (!onBack && !actions) {
    // Nothing to show in a bar: keep the page heading for screen readers only.
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        <h1 className="sr-only">{title}</h1>
        <main className="flex flex-1 flex-col gap-4 px-4">{children}</main>
      </div>
    );
  }
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      <header className="sticky top-0 z-10 flex min-h-14 items-center gap-1 bg-background/85 px-2 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        {onBack ? (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
            <ChevronLeft className="size-6" />
          </Button>
        ) : (
          <span className="w-2" />
        )}
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
        {actions}
      </header>
      <main className="flex flex-1 flex-col gap-4 px-4 pt-2">{children}</main>
    </div>
  );
}

/** Full-screen message for blocking states (no wallet, wrong network…). */
export function Notice({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground [&>svg]:size-7">
        {icon}
      </div>
      <h1 className="text-xl font-bold">{title}</h1>
      {children && (
        <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
      )}
    </div>
  );
}
