import { redirect } from "next/navigation";
import {
  getBuildViewer,
  getProjectDetail,
  hasRequestedJoin,
  isOnTeam,
} from "@/lib/build";
import { BuildDetailClient } from "@/components/build-detail-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Build Board | AISA Atlas",
};

export default async function BuildProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await getBuildViewer();
  const project = await getProjectDetail(slug, viewer);

  // Unknown slugs and member-invisible drafts both land back on the board
  if (!project) redirect("/build");

  const [requested, onTeam] = viewer
    ? await Promise.all([
        hasRequestedJoin(project.id, viewer.id),
        isOnTeam(project.id, viewer.id),
      ])
    : [false, false];

  return (
    <BuildDetailClient
      project={project}
      viewerState={{
        isLoggedIn: viewer !== null,
        isModerator: viewer?.isModerator ?? false,
        hasRequested: requested,
        isOnTeam: onTeam,
      }}
    />
  );
}
