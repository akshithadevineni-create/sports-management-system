import { Badge } from "@/components/ui/badge";
import { MembershipStatus } from "@/lib/membership";

const statusClasses: Record<MembershipStatus, string> = {
  Active: "bg-green-100 text-green-800 hover:bg-green-100",
  Expired: "bg-red-100 text-red-800 hover:bg-red-100",
  Pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
};

type MembershipBadgeProps = {
  status: MembershipStatus;
};

const MembershipBadge = ({ status }: MembershipBadgeProps) => {
  return <Badge className={statusClasses[status]}>{status}</Badge>;
};

export default MembershipBadge;
