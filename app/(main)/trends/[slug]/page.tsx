import { redirect } from "next/navigation";
import { getTrendDetail, getTrendViewer } from "@/lib/trends";
import { TrendDetailClient } from "@/components/trend-detail-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Trends | AISA Atlas",
};

export default async function TrendDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await getTrendViewer();
  const trend = await getTrendDetail(slug, viewer);

  // Unknown slugs and member-invisible drafts both land back on the tracker
  if (!trend) redirect("/trends");

  return <TrendDetailClient trend={trend} isAdmin={viewer.isAdmin} />;
}
