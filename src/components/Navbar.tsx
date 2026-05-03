import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, CalendarDays, Home, Menu, X, LogOut, ClipboardCheck, ShieldCheck, Gift, Users, UserRound } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { getMembershipStatus } from "@/lib/membership";
import { readRegistrations } from "@/lib/registrations";

const adminNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/memberships", label: "Members", icon: ShieldCheck },
  { path: "/event-creation", label: "Events", icon: CalendarDays },
  { path: "/registrations", label: "Registrations", icon: ClipboardCheck },
  { path: "/notifications", label: "Approvals", icon: Gift },
];

const userNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/tournament-registration", label: "Register", icon: ClipboardCheck },
  { path: "/events", label: "My Events", icon: CalendarDays },
  { path: "/", label: "My Team", icon: Users },
  { path: "/shop", label: "Store", icon: ShoppingCart },
  { path: "/notifications", label: "My Rewards", icon: Gift },
  { path: "/profile", label: "Profile", icon: UserRound },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount, unreadNotificationCount } = useAppState();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = user?.role === "admin" ? adminNavItems : userNavItems;
  const adminNotificationCount = useMemo(() => {
    if (user?.role !== "admin") return 0;

    try {
      const members = JSON.parse(localStorage.getItem("sports_members") || "[]") as Array<{
        startDate: string;
        expiryDate: string;
        approvalDate: string | null;
      }>;
      const pendingMembers = members.filter(
        (member) => getMembershipStatus(member.startDate, member.expiryDate, member.approvalDate) === "Pending",
      ).length;
      const pendingRegistrations = readRegistrations().filter((registration) => registration.approvalStatus === "pending").length;

      return pendingMembers + pendingRegistrations;
    } catch {
      return 0;
    }
  }, [user?.role]);
  const notificationCount = user?.role === "admin" ? adminNotificationCount : unreadNotificationCount;
  const homePath = user?.role === "admin" ? "/dashboard" : "/";

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={homePath} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm font-display">SP</span>
          </div>
          <span className="font-display font-bold text-lg text-foreground">Sports+</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.path === "/shop" && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
                {item.path === "/notifications" && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-gradient-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    {notificationCount}
                  </span>
                )}
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-lg bg-primary/10 -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Mobile Toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-foreground p-2">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-border"
          >
            <div className="p-4 flex flex-col gap-2">
              <div className="flex justify-end pb-2">
                <ThemeToggle />
              </div>
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {item.path === "/notifications" && notificationCount > 0 && (
                      <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-gradient-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                        {notificationCount}
                      </span>
                    )}
                    {item.path === "/shop" && cartCount > 0 && (
                      <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-gradient-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
