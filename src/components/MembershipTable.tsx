import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format, parseISO } from "date-fns";
import { CalendarIcon, Download, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import MembershipBadge from "@/components/MembershipBadge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportToCSV";
import { getMembershipStatus, MembershipStatus } from "@/lib/membership";
import { sportTypes } from "@/hooks/useTeams";

const MEMBERS_STORAGE_KEY = "sports_members";
const planOptions = ["Basic", "Pro", "Elite"] as const;
const filterOptions = ["All", "Active", "Expired", "Pending"] as const;

type Plan = (typeof planOptions)[number];
type Filter = (typeof filterOptions)[number];

type SportsMember = {
  id: string;
  name: string;
  email: string;
  sport: string;
  plan: Plan;
  startDate: string;
  expiryDate: string;
  approvalDate: string | null;
};

const demoMembers: SportsMember[] = [
  { id: "member-1", name: "Aarav Sharma", email: "aarav@example.com", sport: "Football", plan: "Pro", startDate: "2026-01-10", expiryDate: "2027-01-10", approvalDate: "2026-01-11" },
  { id: "member-2", name: "Riya Kapoor", email: "riya@example.com", sport: "Basketball", plan: "Elite", startDate: "2026-02-01", expiryDate: "2027-02-01", approvalDate: "2026-02-02" },
  { id: "member-3", name: "Vivaan Iyer", email: "vivaan@example.com", sport: "Cricket", plan: "Basic", startDate: "2024-03-12", expiryDate: "2025-03-12", approvalDate: "2024-03-13" },
  { id: "member-4", name: "Tara Joshi", email: "tara@example.com", sport: "Tennis", plan: "Pro", startDate: "2026-04-05", expiryDate: "2027-04-05", approvalDate: null },
  { id: "member-5", name: "Naina Verma", email: "naina@example.com", sport: "Swimming", plan: "Elite", startDate: "2026-03-18", expiryDate: "2027-03-18", approvalDate: "2026-03-19" },
  { id: "member-6", name: "Aisha Khan", email: "aisha@example.com", sport: "Athletics", plan: "Basic", startDate: "2025-01-01", expiryDate: "2025-12-31", approvalDate: "2025-01-02" },
  { id: "member-7", name: "Kabir Rao", email: "kabir@example.com", sport: "Football", plan: "Basic", startDate: "2026-04-12", expiryDate: "2027-04-12", approvalDate: null },
  { id: "member-8", name: "Sara Menon", email: "sara@example.com", sport: "Cricket", plan: "Elite", startDate: "2026-02-20", expiryDate: "2027-02-20", approvalDate: "2026-02-21" },
];

const memberSchema = z.object({
  name: z.string().trim().min(2, "Member name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  sport: z.enum(sportTypes, { required_error: "Select a sport." }),
  plan: z.enum(planOptions, { required_error: "Select a plan." }),
  expiryDate: z.date({ required_error: "Select an expiry date." }),
});

type MemberFormValues = z.infer<typeof memberSchema>;

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `member-${Date.now()}`;
};

const readMembers = (): SportsMember[] => {
  try {
    const storedMembers = localStorage.getItem(MEMBERS_STORAGE_KEY);
    if (!storedMembers) {
      localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(demoMembers));
      return demoMembers;
    }

    const parsedMembers = JSON.parse(storedMembers) as SportsMember[];
    if (parsedMembers.length === 0) {
      localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(demoMembers));
      return demoMembers;
    }

    return parsedMembers;
  } catch {
    return demoMembers;
  }
};

const writeMembers = (members: SportsMember[]) => {
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
};

const formatDate = (date: string) => format(parseISO(date), "dd MMM yyyy");

const MembershipTable = () => {
  const [members, setMembers] = useState<SportsMember[]>(() => readMembers());
  const [filter, setFilter] = useState<Filter>("All");
  const [open, setOpen] = useState(false);

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: "",
      email: "",
      sport: "Football",
      plan: "Basic",
    },
  });

  const membersWithStatus = useMemo(
    () =>
      members.map((member) => ({
        ...member,
        status: getMembershipStatus(member.startDate, member.expiryDate, member.approvalDate),
      })),
    [members],
  );

  const statusCounts = useMemo(() => {
    return membersWithStatus.reduce<Record<MembershipStatus, number>>(
      (acc, member) => {
        acc[member.status] += 1;
        return acc;
      },
      { Active: 0, Expired: 0, Pending: 0 },
    );
  }, [membersWithStatus]);

  const filteredMembers = filter === "All" ? membersWithStatus : membersWithStatus.filter((member) => member.status === filter);

  const updateMembers = (nextMembers: SportsMember[]) => {
    setMembers(nextMembers);
    writeMembers(nextMembers);
  };

  const handleRenew = (memberId: string) => {
    const nextMembers = members.map((member) => {
      if (member.id !== memberId) return member;

      const nextExpiryDate = format(addDays(parseISO(member.expiryDate), 365), "yyyy-MM-dd");
      return {
        ...member,
        expiryDate: nextExpiryDate,
        approvalDate: member.approvalDate || format(new Date(), "yyyy-MM-dd"),
      };
    });

    updateMembers(nextMembers);
    toast.success("Membership renewed for 365 days.");
  };

  const handleAddMember = (values: MemberFormValues) => {
    const nextMember: SportsMember = {
      id: createId(),
      name: values.name,
      email: values.email,
      sport: values.sport,
      plan: values.plan,
      startDate: format(new Date(), "yyyy-MM-dd"),
      expiryDate: format(values.expiryDate, "yyyy-MM-dd"),
      approvalDate: format(new Date(), "yyyy-MM-dd"),
    };

    updateMembers([...members, nextMember]);
    form.reset();
    setOpen(false);
    toast.success("Member added successfully.");
  };

  const handleExportMembers = () => {
    exportToCSV(
      membersWithStatus.map((member) => ({
        name: member.name,
        email: member.email,
        sport: member.sport,
        plan: member.plan,
        startDate: member.startDate,
        expiryDate: member.expiryDate,
        status: member.status,
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {(["Active", "Expired", "Pending"] as MembershipStatus[]).map((status) => (
          <Card key={status} className="border-border bg-gradient-card">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{status} Members</p>
              <p className="mt-2 text-3xl font-display font-bold text-foreground">{statusCounts[status]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Button key={option} type="button" variant={filter === option ? "default" : "outline"} size="sm" onClick={() => setFilter(option)}>
              {option}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="w-fit gap-2" onClick={handleExportMembers}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-fit gap-2">
                <Plus className="h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Add Member</DialogTitle>
              <DialogDescription>Create a new sports membership record.</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddMember)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Member name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="member@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="sport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sport</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sport" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sportTypes.map((sport) => (
                              <SelectItem key={sport} value={sport}>
                                {sport}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {planOptions.map((plan) => (
                              <SelectItem key={plan} value={plan}>
                                {plan}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiry date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn("justify-start gap-2 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              <CalendarIcon className="h-4 w-4" />
                              {field.value ? format(field.value, "dd MMM yyyy") : "Pick an expiry date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">Save Member</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member Name</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No members match this filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.sport}</TableCell>
                  <TableCell>{member.plan}</TableCell>
                  <TableCell>{formatDate(member.startDate)}</TableCell>
                  <TableCell>{formatDate(member.expiryDate)}</TableCell>
                  <TableCell>
                    <MembershipBadge status={member.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => handleRenew(member.id)}>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Renew
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MembershipTable;
