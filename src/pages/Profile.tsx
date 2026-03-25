import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, Mail, MapPin, LogOut, UserCircle, ShieldCheck } from "lucide-react";

type StoredUser = {
  email?: string;
  name?: string;
};

type RegisteredEvent = {
  id: string;
  title: string;
  sport: string;
  date: string;
  venue: string;
  city: string;
};

const Profile = () => {
  const navigate = useNavigate();

  const user = useMemo(() => {
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? (JSON.parse(storedUser) as StoredUser) : null;
    const email = parsedUser?.email || localStorage.getItem("userEmail") || "member@sports.com";
    const name = parsedUser?.name || email.split("@")[0];

    return { email, name };
  }, []);

  const registeredEvents = useMemo(() => {
    const storedEvents = localStorage.getItem("registeredEvents");
    return storedEvents ? (JSON.parse(storedEvents) as RegisteredEvent[]) : [];
  }, []);

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const handleLogout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-2">Profile Dashboard</h1>
            <p className="text-muted-foreground">View your account details and registered events</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:border-primary/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-[1.1fr_1.9fr] gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-border bg-gradient-card p-6"
          >
            <h2 className="text-xl font-display font-semibold text-foreground mb-5">User Info</h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-display font-bold">
                {initials || "SP"}
              </div>
              <div>
                <p className="text-lg font-display font-semibold text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3 text-muted-foreground">
                <Mail className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wide">Email</p>
                  <p className="text-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <UserCircle className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wide">Name</p>
                  <p className="text-foreground">{user.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <ShieldCheck className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wide">Role</p>
                  <p className="text-foreground">Sports Member</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <CalendarDays className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wide">Joined</p>
                  <p className="text-foreground">January 2026</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-gradient-card p-6"
          >
            <h2 className="text-xl font-display font-semibold text-foreground mb-5">Registered Events</h2>

            {registeredEvents.length === 0 ? (
              <div className="text-center py-16">
                <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">You have not registered for any events yet</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {registeredEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs text-primary font-medium mb-1">{event.sport}</p>
                        <h3 className="font-display font-semibold text-foreground">{event.title}</h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        Registered
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        {new Date(event.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {event.venue}, {event.city}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
