import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

/** Placeholder matching a vault row in the list. */
export function VaultRowSkeleton() {
  return (
    <Card className="flex items-center gap-3 p-4">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </Card>
  );
}
