import { Card, Screen, Skeleton } from "./ui";

/** Placeholder matching the Home layout while wallet and chain data load. */
export function HomeSkeleton() {
  return (
    <Screen title={<Skeleton className="h-6 w-28" />}>
      <span className="sr-only" role="status">
        Loading your savings…
      </span>
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="mt-2 h-5 w-24" />
      {[0, 1, 2].map((i) => (
        <VaultRowSkeleton key={i} />
      ))}
    </Screen>
  );
}

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

export function RowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 py-2" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
