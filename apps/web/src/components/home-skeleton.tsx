import { Screen } from "./screen";
import { Skeleton } from "./ui/skeleton";
import { VaultRowSkeleton } from "./vault-row-skeleton";

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
