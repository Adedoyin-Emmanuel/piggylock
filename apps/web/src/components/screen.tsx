import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./ui/button";

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
