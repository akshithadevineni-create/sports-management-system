import { motion } from "framer-motion";
import { Bell, CalendarDays, CheckCircle2 } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getMembershipStatus } from "@/lib/membership";
import { readRegistrations, writeRegistrations } from "@/lib/registrations";
import { format } from "date-fns";
import { toast } from "sonner";

const typeConfig = {
  event: {
    icon: CalendarDays,
    badgeClass: "bg-primary/10 text-primary",
    label: "Event",
  },
  reminder: {
    icon: Bell,
    badgeClass: "bg-accent/10 text-accent",
    label: "Reminder",
  },
} as const;

const Notifications = () => {
  const { user } = useAuth();
  const { notifications, unreadNotificationCount, toggleNotificationRead } = useAppState();

  const [members, adminItems] = useMemo(() => {
    if (user?.role !== "admin") {
      return [[], []] as const;
    }

    try {
      const storedMembers = JSON.parse(localStorage.getItem("sports_members") || "[]") as Array<{
        id: string;
        name: string;
        email: string;
        startDate: string;
        expiryDate: string;
        approvalDate: string | null;
      }>;
      const pendingMembers = storedMembers
        .filter((member) => getMembershipStatus(member.startDate, member.expiryDate, member.approvalDate) === "Pending")
        .map((member) => ({
          id: `member-${member.id}`,
          type: "membership" as const,
          title: member.name,
          subtitle: member.email,
          time: "Membership approval required",
        }));
      const pendingRegistrations = readRegistrations()
        .filter((registration) => registration.approvalStatus === "pending")
        .map((registration) => ({
          id: `registration-${registration.id}`,
          type: "registration" as const,
          title: registration.fullName,
          subtitle: `${registration.eventName} · ${registration.registrationMode}`,
          time: "Registration review required",
        }));

      return [storedMembers, [...pendingMembers, ...pendingRegistrations]] as const;
    } catch {
      return [[], []] as const;
    }
  }, [user?.role]);

  const handleAdminAction = (itemId: string, approved: boolean) => {
    if (itemId.startsWith("member-")) {
      const memberId = itemId.replace("member-", "");
      const nextMembers = members.map((member) =>
        member.id === memberId ? { ...member, approvalDate: approved ? format(new Date(), "yyyy-MM-dd") : null } : member,
      );
      localStorage.setItem("sports_members", JSON.stringify(nextMembers));
      toast.success(approved ? "Membership approved." : "Membership kept pending.");
      window.location.reload();
      return;
    }

    const registrationId = itemId.replace("registration-", "");
    const nextRegistrations = readRegistrations().map((registration) =>
      registration.id === registrationId
        ? { ...registration, approvalStatus: approved ? "approved" : "rejected" }
        : registration,
    );
    writeRegistrations(nextRegistrations);
    toast.success(approved ? "Registration approved." : "Registration rejected.");
    window.location.reload();
  };

  if (user?.role === "admin") {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-4xl font-display font-bold text-foreground">Approvals</h1>
              <Badge variant="secondary">{adminItems.length} open</Badge>
            </div>
            <p className="text-muted-foreground">Admin notifications are limited to membership approvals and registration reviews.</p>
          </motion.div>

          <div className="grid gap-4">
            {adminItems.length === 0 ? (
              <div className="rounded-lg border border-border bg-gradient-card p-8 text-center text-muted-foreground">
                Nothing needs review right now.
              </div>
            ) : (
              adminItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="rounded-2xl border border-border bg-gradient-card p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="font-display font-semibold text-foreground">{item.title}</h3>
                        <Badge variant="outline" className="capitalize">{item.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAdminAction(item.id, true)}>Approve</Button>
                      {item.type === "registration" && (
                        <Button size="sm" variant="outline" onClick={() => handleAdminAction(item.id, false)}>Reject</Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-display font-bold text-foreground">Notifications</h1>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {unreadNotificationCount} unread
            </span>
          </div>
          <p className="text-muted-foreground">Stay updated on registrations, events, and reminders</p>
        </motion.div>

        <div className="grid gap-4">
          {notifications.map((notification, index) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;

            return (
              <motion.button
                key={notification.id}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => toggleNotificationRead(notification.id)}
                className={`w-full text-left p-5 rounded-2xl border transition-colors bg-gradient-card hover:border-primary/30 ${
                  notification.read ? "border-border" : "border-primary/30 bg-primary/5"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${config.badgeClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-semibold text-foreground">{notification.title}</h3>
                        {!notification.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${config.badgeClass}`}>
                          {config.label}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">{notification.time}</span>
                    </div>

                    <p className="text-sm text-muted-foreground">{notification.message}</p>

                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{notification.read ? "Tap to mark as unread" : "Tap to mark as read"}</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
