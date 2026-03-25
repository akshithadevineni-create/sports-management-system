import { motion } from "framer-motion";
import { analyticsData, badges } from "@/data/sportsData";
import { TrendingUp, Calendar, IndianRupee, Moon, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const statCards = [
  { label: "Events Registered", value: analyticsData.summary.eventsRegistered, icon: Calendar, color: "text-primary" },
  { label: "Events Attended", value: analyticsData.summary.eventsAttended, icon: TrendingUp, color: "text-primary" },
  { label: "Gear Spent", value: formatINR(analyticsData.summary.gearSpent), icon: IndianRupee, color: "text-warning" },
  { label: "Event Spent", value: formatINR(analyticsData.summary.eventSpent), icon: IndianRupee, color: "text-accent" },
  { label: "Evening Sessions", value: analyticsData.summary.eveningSessions, icon: Moon, color: "text-accent" },
];

const Analytics = () => {
  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Your Analytics</h1>
          <p className="text-muted-foreground">Track your sports journey and achievements</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl border border-border bg-gradient-card"
            >
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Events per Month */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl border border-border bg-gradient-card"
          >
            <h3 className="font-display font-semibold text-foreground mb-4">Events per Month</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analyticsData.eventsPerMonth}>
                <XAxis dataKey="month" stroke="hsl(240 5% 55%)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(240 5% 55%)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(240 8% 8%)", border: "1px solid hsl(240 6% 18%)", borderRadius: "0.75rem", color: "hsl(0 0% 95%)" }}
                />
                <Bar dataKey="events" fill="hsl(135 100% 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Spending Pie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl border border-border bg-gradient-card"
          >
            <h3 className="font-display font-semibold text-foreground mb-4">Spending Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={analyticsData.spending}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  stroke="none"
                >
                  {analyticsData.spending.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(240 8% 8%)", border: "1px solid hsl(240 6% 18%)", borderRadius: "0.75rem", color: "hsl(0 0% 95%)" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2">
              {analyticsData.spending.map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ background: s.fill }} />
                  <span className="text-muted-foreground">{s.name}: {formatINR(s.value)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Evening Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl border border-border bg-gradient-card mb-8"
        >
          <h3 className="font-display font-semibold text-foreground mb-4">Evening Activity Consistency</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analyticsData.eveningActivity}>
              <CartesianGrid stroke="hsl(240 6% 14%)" strokeDasharray="3 3" />
              <XAxis dataKey="week" stroke="hsl(240 5% 55%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(240 5% 55%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(240 8% 8%)", border: "1px solid hsl(240 6% 18%)", borderRadius: "0.75rem", color: "hsl(0 0% 95%)" }}
              />
              <Line type="monotone" dataKey="sessions" stroke="hsl(270 80% 60%)" strokeWidth={2} dot={{ fill: "hsl(270 80% 60%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="font-display font-semibold text-xl text-foreground mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Badges
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  badge.earned
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-gradient-card opacity-50"
                }`}
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <p className="font-display font-semibold text-sm text-foreground">{badge.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
