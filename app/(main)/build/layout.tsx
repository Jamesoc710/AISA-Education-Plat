import { ClosedNotice } from "@/components/ui/closed-notice";
import { COMMUNITY_CLOSED } from "@/lib/config";

// While Community is closed, every page under this folder shows the closed card.
export default function Layout({ children }: { children: React.ReactNode }) {
  if (COMMUNITY_CLOSED) {
    return <ClosedNotice title="Community is closed for now" body="The build board is taking a short break. Check back soon." />;
  }
  return children;
}
