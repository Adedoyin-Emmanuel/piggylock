import { CircleCheck, Clock, LockOpen } from "lucide-react";
import type { VaultStatus } from "../lib/vault-status";
import { Badge } from "./ui/badge";

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
