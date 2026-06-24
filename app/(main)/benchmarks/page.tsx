import { getBenchmarkViewer, getBenchmarks } from "@/lib/benchmarks";
import { getUseCases } from "@/lib/use-cases";
import { BenchmarksHubClient } from "@/components/benchmarks-hub-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Benchmarks | AISA Atlas",
};

export default async function BenchmarksPage() {
  const viewer = await getBenchmarkViewer();
  const [benchmarks, useCases] = await Promise.all([
    getBenchmarks(viewer),
    getUseCases(viewer),
  ]);

  return (
    <BenchmarksHubClient benchmarks={benchmarks} useCases={useCases} isAdmin={viewer.isAdmin} />
  );
}
