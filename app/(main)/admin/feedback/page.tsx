import { prisma } from "@/lib/prisma";
import { AdminFeedback } from "@/components/admin-feedback";
import { getFeedbackImageUrl } from "@/lib/feedback-storage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Feedback — Admin — AISA Atlas",
};

export default async function AdminFeedbackPage() {
  const rows = await prisma.feedback.findMany({
    select: {
      id: true,
      content: true,
      imagePath: true,
      pageContext: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  type Row = (typeof rows)[number];

  const items = await Promise.all(
    rows.map(async (r: Row) => ({
      id: r.id,
      content: r.content,
      pageContext: r.pageContext,
      status: r.status as "new" | "read" | "resolved",
      createdAt: r.createdAt.toISOString(),
      resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
      userName: r.user.name,
      userEmail: r.user.email,
      imageUrl: r.imagePath ? await getFeedbackImageUrl(r.imagePath) : null,
    })),
  );

  return <AdminFeedback items={items} />;
}
