import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, CheckCircle2, MapPin, Trophy, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser, getCurrentUserKey } from "@/lib/auth";
import { useTeams } from "@/hooks/useTeams";
import { readRegistrations, writeRegistrations } from "@/lib/registrations";

const EVENTS_STORAGE_KEY = "sports_events";

type TournamentEvent = {
  id: string;
  name: string;
  sportType: string;
  date: string;
  venue: string;
  maxTeams: number;
  entryFee: number;
  registeredTeams: string[];
};

type TournamentRegistration = z.infer<typeof registrationSchema> & {
  id: string;
  userKey: string | null;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  eventId: string;
  eventName: string;
  sportType: string;
  eventDate: string;
  eventVenue: string;
  submittedAt: string;
  registeredAt: string;
  registrationMode: "team" | "individual";
  approvalStatus: "pending" | "approved" | "rejected";
};

const individualSports = new Set(["Tennis", "Swimming", "Athletics"]);

const demoTournamentEvents: TournamentEvent[] = [
  {
    id: "registration-demo-football",
    name: "Metro Football Championship",
    sportType: "Football",
    date: "2026-06-06T09:00:00.000Z",
    venue: "Central Turf Arena",
    maxTeams: 16,
    entryFee: 1500,
    registeredTeams: ["City Strikers", "Metro United", "Northside FC", "Harbor Wolves", "Capital Kickers", "East End Rovers"],
  },
  {
    id: "registration-demo-basketball",
    name: "Summer Hoops Invitational",
    sportType: "Basketball",
    date: "2026-06-12T10:30:00.000Z",
    venue: "Downtown Indoor Court",
    maxTeams: 8,
    entryFee: 900,
    registeredTeams: ["Skyline Hoopers", "Downtown Dunkers", "Court Kings"],
  },
  {
    id: "registration-demo-cricket",
    name: "Premier Cricket Knockout",
    sportType: "Cricket",
    date: "2026-06-18T05:00:00.000Z",
    venue: "Lakeside Cricket Ground",
    maxTeams: 16,
    entryFee: 2200,
    registeredTeams: ["Royal Batsmen", "Spin Masters", "Boundary Riders", "Seam Chargers", "Powerplay XI"],
  },
  {
    id: "registration-demo-tennis",
    name: "Open Court Tennis Cup",
    sportType: "Tennis",
    date: "2026-06-22T08:00:00.000Z",
    venue: "Green Court Club",
    maxTeams: 8,
    entryFee: 700,
    registeredTeams: ["Baseline Aces", "Net Ninjas"],
  },
];

const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits."),
  teamName: z.string().trim().min(2, "Team name is required."),
  playerCount: z.coerce.number().int().min(1, "Player count must be at least 1."),
  specialRequirements: z.string().trim().optional(),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

const defaultValues: RegistrationFormValues = {
  fullName: "",
  email: "",
  phone: "",
  teamName: "",
  playerCount: 1,
  specialRequirements: "",
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `registration-${Date.now()}`;
};

const readEvents = (): TournamentEvent[] => {
  try {
    const storedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!storedEvents) {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(demoTournamentEvents));
      return demoTournamentEvents;
    }

    const events = JSON.parse(storedEvents) as TournamentEvent[];
    if (events.length === 0) {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(demoTournamentEvents));
      return demoTournamentEvents;
    }

    return events;
  } catch {
    return demoTournamentEvents;
  }
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const TournamentRegistration = () => {
  const navigate = useNavigate();
  const currentUser = useMemo(() => getCurrentUser(), []);
  const { getUserTeams } = useTeams();
  const [step, setStep] = useState(1);
  const [events] = useState<TournamentEvent[]>(() => readEvents());
  const [selectedEventId, setSelectedEventId] = useState("");

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues,
    mode: "onChange",
  });

  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId), [events, selectedEventId]);
  const isIndividualRegistration = selectedEvent ? individualSports.has(selectedEvent.sportType) : false;
  const availableTeams = useMemo(
    () => (selectedEvent ? getUserTeams(getCurrentUserKey()).filter((team) => team.sportType === selectedEvent.sportType) : []),
    [getUserTeams, selectedEvent],
  );
  const values = form.watch();
  const progress = (step / 3) * 100;
  const canGoNext =
    step === 1
      ? Boolean(selectedEvent)
      : step === 2
        ? form.formState.isValid && (isIndividualRegistration || Boolean(values.teamName))
        : true;

  useEffect(() => {
    form.setValue("fullName", currentUser?.name || "");
    form.setValue("email", currentUser?.email || "");
    form.setValue("phone", currentUser?.phone || "");
  }, [currentUser, form]);

  useEffect(() => {
    if (!selectedEvent) return;

    if (individualSports.has(selectedEvent.sportType)) {
      form.setValue("teamName", "Individual Entry");
      form.setValue("playerCount", 1);
      return;
    }

    const firstTeam = availableTeams[0];
    if (firstTeam) {
      form.setValue("teamName", firstTeam.name);
      form.setValue("playerCount", firstTeam.playerCount);
    } else {
      form.setValue("teamName", "");
      form.setValue("playerCount", 1);
    }
  }, [availableTeams, form, selectedEvent]);

  const handleNext = async () => {
    if (step === 1 && selectedEvent) {
      setStep(2);
      return;
    }

    if (step === 2) {
      const valid = await form.trigger();
      if (valid) setStep(3);
    }
  };

  const handleConfirmRegistration = () => {
    if (!selectedEvent) return;

    const registeredAt = new Date().toISOString();
    const registration: TournamentRegistration = {
      id: createId(),
      userKey: getCurrentUserKey(),
      userName: currentUser?.name,
      userEmail: currentUser?.email,
      userPhone: currentUser?.phone,
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      sportType: selectedEvent.sportType,
      eventDate: selectedEvent.date,
      eventVenue: selectedEvent.venue,
      submittedAt: registeredAt,
      registeredAt,
      registrationMode: isIndividualRegistration ? "individual" : "team",
      approvalStatus: "pending",
      ...form.getValues(),
    };

    const nextRegistrations = [...readRegistrations(), registration];
    writeRegistrations(nextRegistrations);
    toast.success("Registration confirmed! Check your email.");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-display font-bold text-foreground">Tournament Registration</h1>
              <p className="mt-2 text-muted-foreground">Select an event, enter registration details, and confirm your entry.</p>
            </div>
            <Badge variant="secondary">Step {step} of 3</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => {
              const slotsRemaining = Math.max(event.maxTeams - event.registeredTeams.length, 0);
              const selected = selectedEventId === event.id;

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedEventId(event.id)}
                  className={`rounded-lg border bg-gradient-card p-5 text-left transition ${
                    selected ? "border-primary ring-2 ring-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-semibold text-foreground">{event.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{event.venue}</p>
                    </div>
                    <Badge>{event.sportType}</Badge>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {formatDate(event.date)}
                    </span>
                    <span className="flex items-center gap-2">
                      <UsersRound className="h-4 w-4 text-primary" />
                      {slotsRemaining} slots remaining
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <Card className="border-border bg-gradient-card">
            <CardHeader>
              <CardTitle>Registration Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input placeholder="Aarav Sharma" {...field} />
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
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone number</FormLabel>
                        <FormControl>
                          <Input inputMode="numeric" placeholder="9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isIndividualRegistration ? (
                    <>
                      <FormField
                        control={form.control}
                        name="teamName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration type</FormLabel>
                            <FormControl>
                              <Input readOnly {...field} />
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
                            <FormLabel>Player count</FormLabel>
                            <FormControl>
                              <Input readOnly type="number" min={1} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="teamName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                const selectedTeam = availableTeams.find((team) => team.name === value);
                                if (selectedTeam) {
                                  form.setValue("playerCount", selectedTeam.playerCount);
                                }
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your team" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableTeams.map((team) => (
                                  <SelectItem key={team.id} value={team.name}>
                                    {team.name}
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
                        name="playerCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Player count</FormLabel>
                            <FormControl>
                              <Input readOnly type="number" min={1} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="specialRequirements"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Special requirements</FormLabel>
                        <FormControl>
                        <Textarea placeholder="Optional notes for the organizer" className="min-h-24 resize-none" {...field} />
                      </FormControl>
                      {!isIndividualRegistration && availableTeams.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Join or create a {selectedEvent?.sportType} team first to complete this registration.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {step === 3 && selectedEvent && (
          <Card className="border-border bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Confirm Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <h2 className="font-display text-xl font-semibold text-foreground">{selectedEvent.name}</h2>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Trophy className="h-4 w-4 text-primary" />
                  {selectedEvent.sportType}
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {formatDate(selectedEvent.date)}
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  {selectedEvent.venue}
                </p>
              </div>

              <div className="grid gap-2 text-sm">
                <p><span className="text-muted-foreground">Full name:</span> {values.fullName}</p>
                <p><span className="text-muted-foreground">Email:</span> {values.email}</p>
                <p><span className="text-muted-foreground">Phone:</span> {values.phone}</p>
                <p><span className="text-muted-foreground">Registration type:</span> {isIndividualRegistration ? "Individual" : "Team"}</p>
                <p><span className="text-muted-foreground">Team:</span> {values.teamName}</p>
                <p><span className="text-muted-foreground">Players:</span> {values.playerCount}</p>
                <p>
                  <span className="text-muted-foreground">Special requirements:</span>{" "}
                  {values.specialRequirements || "None"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 flex justify-between gap-3">
          <Button variant="outline" disabled={step === 1} onClick={() => setStep((currentStep) => Math.max(currentStep - 1, 1))}>
            Back
          </Button>

          {step < 3 ? (
            <Button disabled={!canGoNext} onClick={handleNext}>
              Next
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!selectedEvent}>Confirm Registration</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm tournament registration</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to register for {selectedEvent?.name}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmRegistration}>Confirm</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentRegistration;
