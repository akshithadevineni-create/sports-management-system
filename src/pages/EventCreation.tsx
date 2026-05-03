import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Plus, Trophy, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { sportTypes, Team } from "@/hooks/useTeams";
import { readRegistrations } from "@/lib/registrations";

const EVENTS_STORAGE_KEY = "sports_events";
const maxTeamOptions = ["4", "8", "16", "32"] as const;

type Match = {
  home: string | null;
  away: string | null;
  winner: string | null;
};

type SportsEvent = {
  id: string;
  name: string;
  sportType: Team["sportType"];
  date: string;
  venue: string;
  maxTeams: number;
  entryFee: number;
  registeredTeams: string[];
  bracket: Match[][] | null;
  createdAt: string;
};

const demoEvents: SportsEvent[] = [
  {
    id: "demo-event-1",
    name: "Football City Knockout",
    sportType: "Football",
    date: "2026-05-04T09:00:00.000Z",
    venue: "Central Turf Arena",
    maxTeams: 8,
    entryFee: 1200,
    registeredTeams: ["City Strikers", "Metro United", "Northside FC", "Harbor Wolves", "Capital Kickers"],
    bracket: null,
    createdAt: "2026-04-02T09:00:00.000Z",
  },
  {
    id: "demo-event-2",
    name: "Hoops Spring Challenge",
    sportType: "Basketball",
    date: "2026-05-08T10:30:00.000Z",
    venue: "Downtown Indoor Court",
    maxTeams: 8,
    entryFee: 900,
    registeredTeams: ["Skyline Hoopers", "Downtown Dunkers", "Court Kings", "Rim Runners"],
    bracket: null,
    createdAt: "2026-04-02T09:10:00.000Z",
  },
  {
    id: "demo-event-3",
    name: "Cricket Premier Cup",
    sportType: "Cricket",
    date: "2026-05-12T04:30:00.000Z",
    venue: "Lakeside Cricket Ground",
    maxTeams: 8,
    entryFee: 1800,
    registeredTeams: ["Royal Batsmen", "Spin Masters", "Boundary Riders", "Seam Chargers", "Powerplay XI"],
    bracket: null,
    createdAt: "2026-04-02T09:20:00.000Z",
  },
  {
    id: "demo-event-4",
    name: "Tennis Ladder Open",
    sportType: "Tennis",
    date: "2026-05-16T08:00:00.000Z",
    venue: "Green Court Club",
    maxTeams: 8,
    entryFee: 700,
    registeredTeams: ["Baseline Aces", "Net Ninjas", "Topspin Titans", "Serve Squad"],
    bracket: null,
    createdAt: "2026-04-02T09:30:00.000Z",
  },
  {
    id: "demo-event-5",
    name: "Aquatic Relay Clash",
    sportType: "Swimming",
    date: "2026-05-20T07:00:00.000Z",
    venue: "Blue Lane Aquatic Center",
    maxTeams: 8,
    entryFee: 600,
    registeredTeams: ["Aqua Jets", "Blue Current", "Lane Leaders", "Wave Racers", "Pool Panthers"],
    bracket: null,
    createdAt: "2026-04-02T09:40:00.000Z",
  },
  {
    id: "demo-event-6",
    name: "Athletics Relay Knockout",
    sportType: "Athletics",
    date: "2026-05-24T06:30:00.000Z",
    venue: "National Track Field",
    maxTeams: 8,
    entryFee: 500,
    registeredTeams: ["Track Blazers", "Marathon Minds", "Jump Crew", "Relay Rockets", "Sprint Syndicate"],
    bracket: null,
    createdAt: "2026-04-02T09:50:00.000Z",
  },
];

const eventSchema = z.object({
  name: z.string().trim().min(3, "Event name must be at least 3 characters."),
  sportType: z.enum(sportTypes, {
    required_error: "Select a sport type.",
  }),
  date: z.date({
    required_error: "Select an event date.",
  }),
  venue: z.string().trim().min(1, "Venue is required."),
  maxTeams: z.enum(maxTeamOptions, {
    required_error: "Select maximum teams.",
  }),
  entryFee: z.coerce.number().min(0, "Entry fee cannot be negative."),
});

type EventFormValues = z.infer<typeof eventSchema>;

const defaultValues: EventFormValues = {
  name: "",
  sportType: "Football",
  date: new Date(),
  venue: "",
  maxTeams: "4",
  entryFee: 0,
};

const readStoredEvents = (): SportsEvent[] => {
  if (typeof window === "undefined") return [];

  try {
    const storedEvents = window.localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!storedEvents) {
      window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(demoEvents));
      return demoEvents;
    }

    const parsedEvents = JSON.parse(storedEvents) as SportsEvent[];
    if (parsedEvents.length === 0) {
      window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(demoEvents));
      return demoEvents;
    }

    let changed = false;
    const upgradedEvents = parsedEvents.map((event) => {
      const demoEvent = demoEvents.find((item) => item.id === event.id);
      if (!demoEvent || event.bracket) return event;

      const isDemoEvent = event.id.startsWith("demo-event-");
      const registeredTeams = isDemoEvent ? demoEvent.registeredTeams : Array.from(new Set([...event.registeredTeams, ...demoEvent.registeredTeams]));
      if (registeredTeams.length === event.registeredTeams.length && event.maxTeams >= demoEvent.maxTeams) return event;

      changed = true;
      return {
        ...event,
        maxTeams: Math.max(event.maxTeams, demoEvent.maxTeams),
        registeredTeams,
      };
    });

    const storedIds = new Set(upgradedEvents.map((event) => event.id));
    const missingDemoEvents = demoEvents.filter((event) => !storedIds.has(event.id));
    const nextEvents = [...upgradedEvents, ...missingDemoEvents];

    if (changed || missingDemoEvents.length > 0) {
      window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(nextEvents));
    }

    return nextEvents;
  } catch {
    return demoEvents;
  }
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `event-${Date.now()}`;
};

const saveEvents = (events: SportsEvent[]) => {
  window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
};

const fisherYatesShuffle = (teams: string[]) => {
  const shuffledTeams = [...teams];

  for (let i = shuffledTeams.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
  }

  return shuffledTeams;
};

const generateSingleEliminationBracket = (teamNames: string[]): Match[][] => {
  const roundCount = Math.ceil(Math.log2(teamNames.length));
  const bracketSize = 2 ** roundCount;
  const shuffledTeams = fisherYatesShuffle(teamNames);
  const seededTeams = [...shuffledTeams, ...Array(bracketSize - shuffledTeams.length).fill("BYE")];

  const rounds: Match[][] = [];
  const roundOne: Match[] = [];

  for (let i = 0; i < seededTeams.length; i += 2) {
    roundOne.push({
      home: seededTeams[i],
      away: seededTeams[i + 1],
      winner: null,
    });
  }

  rounds.push(roundOne);

  for (let roundIndex = 1; roundIndex < roundCount; roundIndex += 1) {
    const matchCount = 2 ** (roundCount - roundIndex - 1);
    rounds.push(
      Array.from({ length: matchCount }, () => ({
        home: null,
        away: null,
        winner: null,
      })),
    );
  }

  return rounds;
};

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const EventCreation = () => {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<SportsEvent[]>(() => readStoredEvents());
  const [refreshTick, setRefreshTick] = useState(0);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  const registrations = useMemo(() => readRegistrations(), [refreshTick]);

  const onSubmit = (values: EventFormValues) => {
    const nextEvent: SportsEvent = {
      id: createId(),
      name: values.name,
      sportType: values.sportType,
      date: values.date.toISOString(),
      venue: values.venue,
      maxTeams: Number(values.maxTeams),
      entryFee: values.entryFee,
      registeredTeams: [],
      bracket: null,
      createdAt: new Date().toISOString(),
    };

    setEvents((currentEvents) => [...currentEvents, nextEvent]);
    toast.success("Event created successfully!");
    form.reset(defaultValues);
    setOpen(false);
  };

  const updateEvent = (eventId: string, updater: (event: SportsEvent) => SportsEvent) => {
    setEvents((currentEvents) => currentEvents.map((event) => (event.id === eventId ? updater(event) : event)));
  };

  const generateBracket = (event: SportsEvent) => {
    if (event.registeredTeams.length < 2) {
      toast.error("Register at least 2 teams before generating a bracket.");
      return;
    }

    updateEvent(event.id, (currentEvent) => ({
      ...currentEvent,
      bracket: generateSingleEliminationBracket(currentEvent.registeredTeams),
    }));
    toast.success("Bracket generated!");
    setRefreshTick((value) => value + 1);
  };

  const setWinner = (eventId: string, roundIndex: number, matchIndex: number, winner: string) => {
    if (winner === "BYE") return;

    updateEvent(eventId, (event) => {
      if (!event.bracket) return event;

      const nextBracket = event.bracket.map((round) => round.map((match) => ({ ...match })));
      nextBracket[roundIndex][matchIndex].winner = winner;

      for (let currentRound = roundIndex + 1; currentRound < nextBracket.length; currentRound += 1) {
        const destinationMatchIndex = Math.floor(matchIndex / 2 ** (currentRound - roundIndex));
        const sourceMatchIndex = Math.floor(matchIndex / 2 ** (currentRound - roundIndex - 1));
        const destinationMatch = nextBracket[currentRound][destinationMatchIndex];

        if (!destinationMatch) break;

        if (currentRound === roundIndex + 1) {
          if (matchIndex % 2 === 0) {
            destinationMatch.home = winner;
          } else {
            destinationMatch.away = winner;
          }
        }

        if (sourceMatchIndex === destinationMatchIndex || destinationMatch.winner === winner) {
          destinationMatch.winner = null;
        }
      }

      return { ...event, bracket: nextBracket };
    });
    setRefreshTick((value) => value + 1);
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-display font-bold text-foreground">Event Brackets</h1>
            <p className="text-muted-foreground">Create sports events, register saved teams, and run single-elimination brackets.</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-fit gap-2">
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Create Event</DialogTitle>
                <DialogDescription>Set up the tournament details before registering teams.</DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event name</FormLabel>
                        <FormControl>
                          <Input placeholder="Summer Knockout Cup" {...field} />
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn("justify-start gap-2 text-left font-normal", !field.value && "text-muted-foreground")}
                              >
                                <CalendarIcon className="h-4 w-4" />
                                {field.value ? formatDate(field.value) : "Pick a date"}
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

                  <FormField
                    control={form.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue</FormLabel>
                        <FormControl>
                          <Input placeholder="City Sports Arena" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="maxTeams"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max teams</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select max teams" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {maxTeamOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
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
                      name="entryFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entry fee</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="submit">Save Event</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="mb-2 text-xl font-display font-semibold text-foreground">No events yet</h2>
              <p className="text-muted-foreground">Create an event to begin registering teams and generating brackets.</p>
            </div>
          ) : (
            events.map((event) => {
              const eventRegistrations = registrations.filter((registration) => registration.eventId === event.id);
              const approvedRegistrations = eventRegistrations.filter((registration) => registration.approvalStatus === "approved");
              const pendingRegistrations = eventRegistrations.filter((registration) => registration.approvalStatus === "pending");

              return (
                <Card key={event.id} className="overflow-hidden border-border bg-gradient-card">
                  <CardHeader className="gap-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge>{event.sportType}</Badge>
                          <Badge variant="outline">{event.maxTeams} teams max</Badge>
                          {event.bracket && <Badge variant="secondary">Bracket ready</Badge>}
                        </div>
                        <CardTitle>{event.name}</CardTitle>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {formatDate(event.date)} at {event.venue} · Entry fee: ₹{event.entryFee}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="outline">{eventRegistrations.length} registrations received</Badge>
                          <Badge variant="outline">{approvedRegistrations.length} approved</Badge>
                          <Badge variant="outline">{pendingRegistrations.length} pending review</Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => generateBracket(event)}
                        disabled={event.registeredTeams.length < 2}
                        className="w-fit gap-2"
                      >
                        <Trophy className="h-4 w-4" />
                        Generate Bracket
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                        <UsersRound className="h-4 w-4 text-primary" />
                        Bracket Entries ({event.registeredTeams.length}/{event.maxTeams})
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-lg border border-border bg-background p-4">
                          <p className="text-sm text-muted-foreground">Entries seeded for bracket</p>
                          <p className="mt-2 text-2xl font-display font-bold text-foreground">{event.registeredTeams.length}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-background p-4">
                          <p className="text-sm text-muted-foreground">Registration records</p>
                          <p className="mt-2 text-2xl font-display font-bold text-foreground">{eventRegistrations.length}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-background p-4">
                          <p className="text-sm text-muted-foreground">Pending approvals</p>
                          <p className="mt-2 text-2xl font-display font-bold text-foreground">{pendingRegistrations.length}</p>
                        </div>
                      </div>
                    </div>

                    {event.bracket && (
                      <div className="overflow-x-auto pb-2">
                        <div className="flex min-w-max gap-5">
                          {event.bracket.map((round, roundIndex) => (
                            <div key={`${event.id}-round-${roundIndex}`} className="flex w-64 shrink-0 flex-col gap-4">
                              <h3 className="text-sm font-semibold text-muted-foreground">Round {roundIndex + 1}</h3>
                              <div className="flex flex-col gap-4">
                                {round.map((match, matchIndex) => (
                                  <div key={`${event.id}-${roundIndex}-${matchIndex}`} className="rounded-lg border border-border bg-background p-3">
                                    <div className="space-y-2">
                                      {(["home", "away"] as const).map((side) => {
                                        const teamName = match[side];
                                        const isWinner = teamName && match.winner === teamName;

                                        return (
                                          <div
                                            key={side}
                                            className={cn(
                                              "flex min-h-10 items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm",
                                              isWinner ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground",
                                              !teamName && "text-muted-foreground",
                                            )}
                                          >
                                            <span className="truncate">{teamName || "TBD"}</span>
                                            {teamName && teamName !== "BYE" && roundIndex < event.bracket!.length && (
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant={isWinner ? "secondary" : "outline"}
                                                onClick={() => setWinner(event.id, roundIndex, matchIndex, teamName)}
                                              >
                                                Set Winner
                                              </Button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCreation;
