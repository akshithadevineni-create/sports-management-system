import { motion } from "framer-motion";
import { Bell, CalendarDays, CheckCircle2 } from "lucide-react";
import { useAppState } from "@/context/AppContext";

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
  const { notifications, unreadNotificationCount, toggleNotificationRead } = useAppState();

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
