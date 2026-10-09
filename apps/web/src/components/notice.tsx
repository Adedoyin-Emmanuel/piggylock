import type { ReactNode } from "react";

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
