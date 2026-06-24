import { redirect } from "next/navigation";
import { getBenchmarkDetail, getBenchmarkViewer } from "@/lib/benchmarks";
import { BenchmarkDetailClient } from "@/components/benchmark-detail-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Benchmarks | AISA Atlas",
};

export default async function BenchmarkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await getBenchmarkViewer();
  const benchmark = await getBenchmarkDetail(slug, viewer);

  // Unknown slugs and member-invisible drafts both land back on the index.
  if (!benchmark) redirect("/benchmarks");

  return <BenchmarkDetailClient benchmark={benchmark} isAdmin={viewer.isAdmin} />;
}
