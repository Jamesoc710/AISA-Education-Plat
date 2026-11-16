import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { MainShell } from "@/components/main-shell";
import { getDoorTeams } from "@/lib/team-data";
import { COMMUNITY_CLOSED } from "@/lib/config";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthUser();

  let user: { id: string; email: string; name: string | null; role: string } | null = null;
  if (authUser) {
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, email: true, name: true, role: true },
    });
    if (dbUser) user = dbUser;
  }

  // The Community menu is the only consumer; skip the query while it is closed.
  const teams = COMMUNITY_CLOSED ? [] : await getDoorTeams();

  return (
    <MainShell user={user} teams={teams}>
      {children}
    </MainShell>
  );
}
