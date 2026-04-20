import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { MainShell } from "@/components/main-shell";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let user: { id: string; email: string; name: string | null; role: string } | null = null;
  if (authUser) {
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, email: true, name: true, role: true },
    });
    if (dbUser) user = dbUser;
  }

  return <MainShell user={user}>{children}</MainShell>;
}
