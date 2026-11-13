import type { PageKey } from "../types";

/** Keeps page transitions consistent while the shared admin shell stays mounted. */
export function PanelScreen({ page, children }: { page: PageKey; children: React.ReactNode }) {
  return (
    <div
      key={page}
      className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 motion-reduce:animate-none"
      aria-label={`${page} screen`}
    >
      {children}
    </div>
  );
}
