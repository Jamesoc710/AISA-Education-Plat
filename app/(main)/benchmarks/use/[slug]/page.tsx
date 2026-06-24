import { redirect } from "next/navigation";
import { getBenchmarkViewer } from "@/lib/benchmarks";
import { getUseCaseDetail } from "@/lib/use-cases";
import { UseCaseDetailClient } from "@/components/use-case-detail-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Benchmarks | AISA Atlas",
};

export default async function UseCaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await getBenchmarkViewer();
  const useCase = await getUseCaseDetail(slug, viewer);

  // Unknown slugs and member-invisible drafts both land back on the explorer.
  if (!useCase) redirect("/benchmarks");

  return <UseCaseDetailClient useCase={useCase} isAdmin={viewer.isAdmin} />;
}
