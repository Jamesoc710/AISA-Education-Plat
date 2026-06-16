import { getTrendViewer, getTrends } from "@/lib/trends";
import { TrendsClient } from "@/components/trends-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Trends | AISA Atlas",
};

export default async function TrendsPage() {
  const viewer = await getTrendViewer();
  const trends = await getTrends(viewer);

  return <TrendsClient trends={trends} isAdmin={viewer.isAdmin} />;
}
