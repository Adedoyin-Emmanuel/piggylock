/** PiggyLock mark (same artwork as the app icon) plus wordmark. */
export function Logo() {
  return (
    <span className="flex items-center gap-2.5 font-bold">
      <img src="/logo.svg" alt="" width={32} height={32} className="size-8 rounded-lg" />
      PiggyLock
    </span>
  );
}
