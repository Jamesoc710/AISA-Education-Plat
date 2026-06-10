import { getBuildViewer, getProjects } from "@/lib/build";
import { BuildClient } from "@/components/build-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Build Board | AISA Atlas",
};

export default async function BuildPage() {
  const viewer = await getBuildViewer();
  const projects = await getProjects(viewer);

  return (
    <BuildClient projects={projects} isModerator={viewer?.isModerator ?? false} />
  );
}
