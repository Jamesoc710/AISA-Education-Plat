import { PageSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <PageSkeleton maxWidth={1200} padding="40px 40px 80px" rows={4} />;
}
