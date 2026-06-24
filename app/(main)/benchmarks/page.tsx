import { getBenchmarkViewer, getBenchmarks } from "@/lib/benchmarks";
import { BenchmarksClient } from "@/components/benchmarks-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Benchmarks | AISA Atlas",
};

export default async function BenchmarksPage() {
  const viewer = await getBenchmarkViewer();
  const benchmarks = await getBenchmarks(viewer);

  return <BenchmarksClient benchmarks={benchmarks} isAdmin={viewer.isAdmin} />;
}
