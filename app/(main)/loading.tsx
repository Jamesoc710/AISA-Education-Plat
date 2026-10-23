import { PageSkeleton } from "@/components/ui/skeleton";

/**
 * Generic content-area skeleton. Renders inside the (main) layout, so the top
 * nav stays put and only the content swaps. Routes whose frame differs enough
 * to visibly jump have their own loading.tsx.
 */
export default function MainLoading() {
  return <PageSkeleton />;
}
