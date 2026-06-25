import { redirect } from "next/navigation";
import {
  getBuildViewer,
  getMyRequests,
  getPendingRequests,
  STALE_REQUEST_DAYS,
} from "@/lib/build";
import { BuildRequestsClient } from "@/components/build-requests-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your requests | AISA Atlas",
};

export default async function BuildRequestsPage() {
  const viewer = await getBuildViewer();
  if (!viewer) redirect("/login?redirect=/build/requests");

  const [mine, pending] = await Promise.all([
    getMyRequests(viewer),
    getPendingRequests(viewer), // [] for non-moderators
  ]);

  return (
    <BuildRequestsClient
      mine={mine}
      pending={pending}
      isModerator={viewer.isModerator}
      staleDays={STALE_REQUEST_DAYS}
    />
  );
}
