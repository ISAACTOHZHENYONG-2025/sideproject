import GroupRoom from "@/components/group/GroupRoom";
import { requireGroupEnabled } from "@/lib/features";

export default function GroupPage() {
  requireGroupEnabled();
  return <GroupRoom />;
}
