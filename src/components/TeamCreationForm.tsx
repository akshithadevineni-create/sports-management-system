import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, UserPlus, UserRound, UsersRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUserKey } from "@/lib/auth";
import { sportTypes, useTeams } from "@/hooks/useTeams";

const teamSchema = z.object({
  name: z.string().trim().min(3, "Team name must be at least 3 characters."),
  sportType: z.enum(sportTypes, {
    required_error: "Select a sport type.",
  }),
  captainName: z.string().trim().min(1, "Team captain name is required."),
  playerCount: z.number({ required_error: "Number of players is required." }).int().min(2, "Minimum 2 players.").max(30, "Maximum 30 players."),
  description: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
});

type TeamFormValues = z.infer<typeof teamSchema>;

const defaultValues: TeamFormValues = {
  name: "",
  sportType: "Football",
  captainName: "",
  playerCount: 2,
  description: "",
};

const createTeamId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `team-${Date.now()}`;
};

const TeamCreationForm = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { teams, addTeam, joinTeam } = useTeams();
  const currentUserKey = getCurrentUserKey();

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues,
  });

  const onSubmit = (values: TeamFormValues) => {
    addTeam({
      id: createTeamId(),
        name: values.name,
        sportType: values.sportType,
        captainName: user?.name || values.captainName,
        captainEmail: user?.email,
        captainKey: currentUserKey,
        playerCount: values.playerCount,
        description: values.description,
        members: currentUserKey
          ? [
              {
                userKey: currentUserKey,
                name: user?.name || values.captainName,
                email: user?.email,
                role: "captain",
                joinedAt: new Date().toISOString(),
              },
            ]
          : [],
        createdAt: new Date().toISOString(),
      });

    toast.success("Team created successfully!");
    form.reset(defaultValues);
    setOpen(false);
  };

  return (
    <section className="mt-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Create a Team</DialogTitle>
              <DialogDescription>Add your roster details and save the team locally on this device.</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team name</FormLabel>
                      <FormControl>
                        <Input placeholder="City Strikers" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sportType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sport type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sport" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sportTypes.map((sportType) => (
                            <SelectItem key={sportType} value={sportType}>
                              {sportType}
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
                  name="captainName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team captain name</FormLabel>
                      <FormControl>
                        <Input placeholder="Aarav Sharma" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="playerCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of players</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={2}
                          max={30}
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional notes about the team" className="min-h-24 resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">Save Team</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {teams.length > 0 && (
        <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="overflow-hidden border-border bg-gradient-card">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-xl">{team.name}</CardTitle>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary" className="shrink-0">
                      {team.sportType}
                    </Badge>
                    {currentUserKey && team.members?.some((member) => member.userKey === currentUserKey) && (
                      <Badge variant="outline">Joined</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserRound className="h-4 w-4 text-primary" />
                  <span>Captain: {team.captainName}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UsersRound className="h-4 w-4 text-primary" />
                  <span>{team.members?.length || 0}/{team.playerCount} players</span>
                </div>
                {team.description && <p className="line-clamp-3 text-muted-foreground">{team.description}</p>}
                {currentUserKey && !team.members?.some((member) => member.userKey === currentUserKey) && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    disabled={(team.members?.length || 0) >= team.playerCount}
                    onClick={() => {
                      const joined = joinTeam(team.id, {
                        name: user?.name || "Sports Member",
                        email: user?.email,
                      });
                      if (joined) toast.success(`You joined ${team.name}`);
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    {(team.members?.length || 0) >= team.playerCount ? "Team Full" : "Join Team"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default TeamCreationForm;
