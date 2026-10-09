import { CircleCheck, Clock, Lock, LockOpen } from "lucide-react";
import type { VaultStatus } from "../lib/vault-status";
import { cn } from "../lib/cn";
import { Badge } from "./ui";

export function StatusBadge({ status }: { status: VaultStatus }) {
  if (status === "matured")
    return (
      <Badge variant="success">
        <LockOpen /> Ready
      </Badge>
    );
  if (status === "withdrawn")
    return (
      <Badge variant="outline">
        <CircleCheck /> Withdrawn
      </Badge>
    );
  return (
    <Badge variant="secondary">
      <Clock /> Locked
    </Badge>
  );
}

export function VaultIcon({ status, className }: { status: VaultStatus; className?: string }) {
  const Icon = status === "matured" ? LockOpen : status === "withdrawn" ? CircleCheck : Lock;
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full",
        status === "matured"
          ? "bg-primary text-primary-foreground"
          : status === "withdrawn"
            ? "bg-muted text-muted-foreground"
            : "bg-accent text-accent-foreground",
        className,
      )}
    >
      <Icon className="size-5" />
    </div>
  );
}
