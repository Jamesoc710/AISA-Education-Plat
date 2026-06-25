import { getBuildViewer, getProjects, getTracks } from "@/lib/build";
import { BuildClient } from "@/components/build-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Build Board | AISA Atlas",
};

export default async function BuildPage() {
  const viewer = await getBuildViewer();
  const [projects, tracks] = await Promise.all([getProjects(viewer), getTracks()]);

  return (
    <BuildClient
      projects={projects}
      isModerator={viewer?.isModerator ?? false}
      isLoggedIn={viewer !== null}
      tracks={tracks}
    />
  );
}
