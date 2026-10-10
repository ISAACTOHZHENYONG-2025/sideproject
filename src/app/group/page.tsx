import GroupRoom from "@/components/group/GroupRoom";
import { requireGroupEnabled } from "@/lib/featureFlags";

export default function GroupPage() {
  requireGroupEnabled();
  return <GroupRoom />;
}
