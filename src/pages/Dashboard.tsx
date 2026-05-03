import { addDays, format, parseISO } from "date-fns";
import { CalendarCheck, Download, Package, ShieldCheck, Trophy, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import MembershipBadge from "@/components/MembershipBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { events, products } from "@/data/sportsData";
import { useAuth } from "@/contexts/AuthContext";
import { useTeams } from "@/hooks/useTeams";
import { exportToCSV } from "@/lib/exportToCSV";
import { formatINR, getNetPrice } from "@/lib/shop";
import { getMembershipStatus, MembershipStatus } from "@/lib/membership";
import { readRegistrations, writeRegistrations } from "@/lib/registrations";

type SportsMember = {
  id: string;
  name: string;
  email: string;
  sport: string;
  plan: "Basic" | "Pro" | "Elite";
  startDate: string;
  expiryDate: string;
  approvalDate: string | null;
};

type StoredUser = {
  name: string;
  email?: string;
  phone?: string;
};

const MEMBERS_STORAGE_KEY = "sports_members";

const fallbackMembers: SportsMember[] = [
  { id: "dashboard-member-1", name: "Ananya", email: "ananya@sports.com", sport: "Football", plan: "Elite", startDate: "2026-01-01", expiryDate: "2027-01-01", approvalDate: "2026-01-02" },
  { id: "dashboard-member-2", name: "Adithi", email: "adithi@sports.com", sport: "Basketball", plan: "Pro", startDate: "2026-02-01", expiryDate: "2027-02-01", approvalDate: "2026-02-02" },
  { id: "dashboard-member-3", name: "Akshitha", email: "akshitha@sports.com", sport: "Cricket", plan: "Basic", startDate: "2026-03-01", expiryDate: "2027-03-01", approvalDate: null },
];

const revenueData = [
  { month: "Jan", funds: 42000 },
  { month: "Feb", funds: 52000 },
  { month: "Mar", funds: 61000 },
  { month: "Apr", funds: 74000 },
  { month: "May", funds: 86000 },
  { month: "Jun", funds: 98000 },
];

const readUsers = (): StoredUser[] => {
  try {
    const storedUsers = localStorage.getItem("authUsers");
    return storedUsers ? (JSON.parse(storedUsers) as StoredUser[]) : [];
  } catch {
    return [];
  }
};

const readMembers = (): SportsMember[] => {
  try {
    const storedMembers = localStorage.getItem(MEMBERS_STORAGE_KEY);
    const members = storedMembers ? (JSON.parse(storedMembers) as SportsMember[]) : fallbackMembers;
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members.length ? members : fallbackMembers));
    return members.length ? members : fallbackMembers;
  } catch {
    return fallbackMembers;
  }
};

const writeMembers = (members: SportsMember[]) => {
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
};

const getUserKey = (email: string) => `email:${email.toLowerCase()}`;

const Dashboard = () => {
  const { user } = useAuth();
  const { getUserTeams } = useTeams();
  const [members, setMembers] = useState<SportsMember[]>(() => readMembers());
  const [users] = useState<StoredUser[]>(() => readUsers());

  const registrations = useMemo(() => readRegistrations(), []);
  const currentUserKey = user?.email ? getUserKey(user.email) : null;
  const userTeams = useMemo(() => getUserTeams(currentUserKey), [currentUserKey, getUserTeams]);
  const myRegistrations = registrations.filter((registration) => {
    if (!user) return false;
    if (currentUserKey && registration.userKey) return registration.userKey === currentUserKey;
    return registration.userEmail?.toLowerCase() === user.email.toLowerCase();
  });

  useEffect(() => {
    if (!user || members.some((member) => member.email.toLowerCase() === user.email.toLowerCase())) return;

    const nextMembership: SportsMember = {
      id: `member-${user.email}`,
      name: user.name,
      email: user.email,
      sport: "Football",
      plan: user.role === "admin" ? "Elite" : "Basic",
      startDate: format(new Date(), "yyyy-MM-dd"),
      expiryDate: format(addDays(new Date(), 365), "yyyy-MM-dd"),
      approvalDate: user.role === "admin" ? format(new Date(), "yyyy-MM-dd") : null,
    };
    const nextMembers = [...members, nextMembership];
    writeMembers(nextMembers);
    setMembers(nextMembers);
  }, [members, user]);

  const myMembership = useMemo(() => {
    if (!user) return null;
    return members.find((member) => member.email.toLowerCase() === user.email.toLowerCase()) || null;
  }, [members, user]);

  const myMembershipStatus = myMembership
    ? getMembershipStatus(myMembership.startDate, myMembership.expiryDate, myMembership.approvalDate)
    : "Pending";

  const updateMemberApproval = (memberId: string, approvalDate: string | null) => {
    const nextMembers = members.map((member) => (member.id === memberId ? { ...member, approvalDate } : member));
    setMembers(nextMembers);
    writeMembers(nextMembers);
    toast.success(approvalDate ? "Membership approved." : "Membership rejected.");
  };

  const exportMembers = () => {
    exportToCSV(
      members.map((member) => ({
        name: member.name,
        email: member.email,
        sport: member.sport,
        plan: member.plan,
        startDate: member.startDate,
        expiryDate: member.expiryDate,
        status: getMembershipStatus(member.startDate, member.expiryDate, member.approvalDate),
      })),
      `sports_members_${format(new Date(), "yyyy-MM-dd")}.csv`,
      {
        name: "Member Name",
        email: "Email",
        sport: "Sport",
        plan: "Plan",
        startDate: "Start Date",
        expiryDate: "Expiry Date",
        status: "Status",
      },
    );
  };

  const pendingMembers = members.filter((member) => getMembershipStatus(member.startDate, member.expiryDate, member.approvalDate) === "Pending");
  const pendingRegistrations = registrations.filter((registration) => registration.approvalStatus === "pending");
  const recommendedProducts = products.slice(0, 4);
  const upcomingEvents = events.slice(0, 4);

  const updateRegistrationApproval = (registrationId: string, approvalStatus: "approved" | "rejected") => {
    const nextRegistrations = registrations.map((registration) =>
      registration.id === registrationId ? { ...registration, approvalStatus } : registration,
    );
    writeRegistrations(nextRegistrations);
    toast.success(approvalStatus === "approved" ? "Registration approved." : "Registration rejected.");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 rounded-lg border border-border bg-gradient-card p-6">
          <Badge className="mb-3">{user?.role === "admin" ? "Admin Dashboard" : "User Dashboard"}</Badge>
          <h1 className="text-4xl font-display font-bold text-foreground">Welcome, {user?.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {user?.role === "admin"
              ? "Manage registrations, memberships, approvals, users, and funds from one place."
              : "Track your events, membership, products, and team activity."}
          </p>
        </div>

        <div className="grid gap-6">
          {user?.role === "user" && (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border bg-gradient-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarCheck className="h-5 w-5 text-primary" />
                      Upcoming Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="rounded-lg border border-border bg-background p-3">
                        <p className="font-medium text-foreground">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.venue} · {new Date(event.date).toLocaleDateString("en-IN")}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-border bg-gradient-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      My Registrations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myRegistrations.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">No registrations for this login yet.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Sport</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {myRegistrations.map((registration) => (
                            <TableRow key={registration.id}>
                              <TableCell>{registration.eventName}</TableCell>
                              <TableCell>{registration.sportType}</TableCell>
                              <TableCell className="capitalize">{registration.registrationMode || "team"}</TableCell>
                              <TableCell>{registration.teamName}</TableCell>
                              <TableCell>{new Date(registration.registeredAt || registration.submittedAt).toLocaleDateString("en-IN")}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/tournament-registration">Register for Tournament</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/">Create or Join Team</Link>
                </Button>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="border-border bg-gradient-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      My Membership
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <MembershipBadge status={myMembershipStatus as MembershipStatus} />
                    <p className="text-sm text-muted-foreground">Plan: {myMembership?.plan}</p>
                    <p className="text-sm text-muted-foreground">
                      Expires: {myMembership ? format(parseISO(myMembership.expiryDate), "dd MMM yyyy") : "Not available"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border bg-gradient-card lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UsersRound className="h-5 w-5 text-primary" />
                      My Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userTeams.length === 0 ? (
                      <>
                        <p className="text-lg font-display font-semibold text-foreground">No team yet</p>
                        <p className="mt-2 text-sm text-muted-foreground">Create a team or join one from the team hub.</p>
                      </>
                    ) : (
                      <div className="space-y-3">
                        {userTeams.slice(0, 3).map((team) => (
                          <div key={team.id} className="rounded-lg border border-border bg-background p-3">
                            <p className="font-medium text-foreground">{team.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {team.sportType} · {team.members?.length || 0}/{team.playerCount} players
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border bg-gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Recommended Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                  {recommendedProducts.map((product) => (
                    <div key={product.id} className="rounded-lg border border-border bg-background p-4">
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{product.brand}</p>
                      <p className="mt-3 font-display font-semibold text-foreground">{formatINR(getNetPrice(product.price))}</p>
                      <p className="text-xs text-muted-foreground">incl. GST</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-border bg-gradient-card">
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">Total Registrations</p>
                    <p className="mt-2 text-3xl font-display font-bold text-foreground">{registrations.length}</p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-gradient-card">
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">All Members</p>
                    <p className="mt-2 text-3xl font-display font-bold text-foreground">{members.length}</p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-gradient-card">
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">Pending Approvals</p>
                    <p className="mt-2 text-3xl font-display font-bold text-foreground">{pendingMembers.length + pendingRegistrations.length}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border bg-gradient-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>All Members</CardTitle>
                  <Button variant="outline" size="sm" className="gap-2" onClick={exportMembers}>
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Sport</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>{member.name}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.sport}</TableCell>
                          <TableCell>{member.plan}</TableCell>
                          <TableCell>
                            <MembershipBadge status={getMembershipStatus(member.startDate, member.expiryDate, member.approvalDate)} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-border bg-gradient-card">
                <CardHeader>
                  <CardTitle>Revenue / Funds</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={revenueData}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="funds" stroke="hsl(var(--primary))" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border bg-gradient-card">
                  <CardHeader>
                    <CardTitle>Pending Approvals</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pendingMembers.length === 0 && pendingRegistrations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No pending approvals.</p>
                    ) : (
                      <>
                        {pendingMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                            <div>
                              <div className="mb-1 flex items-center gap-2">
                                <p className="font-medium text-foreground">{member.name}</p>
                                <Badge variant="outline">Membership</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateMemberApproval(member.id, format(new Date(), "yyyy-MM-dd"))}>Approve</Button>
                            </div>
                          </div>
                        ))}
                        {pendingRegistrations.map((registration) => (
                          <div key={registration.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                            <div>
                              <div className="mb-1 flex items-center gap-2">
                                <p className="font-medium text-foreground">{registration.fullName}</p>
                                <Badge variant="outline">Registration</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {registration.eventName} · <span className="capitalize">{registration.registrationMode}</span>
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateRegistrationApproval(registration.id, "approved")}>Approve</Button>
                              <Button size="sm" variant="outline" onClick={() => updateRegistrationApproval(registration.id, "rejected")}>Reject</Button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border bg-gradient-card">
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((storedUser) => {
                          const email = storedUser.email || `${storedUser.phone}@sports.local`;
                          const role = email.toLowerCase() === "ananya@sports.com" ? "admin" : "user";
                          return (
                            <TableRow key={email}>
                              <TableCell>{storedUser.name}</TableCell>
                              <TableCell>{email}</TableCell>
                              <TableCell className="capitalize">{role}</TableCell>
                              <TableCell><Badge variant="secondary">Active</Badge></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
