import { motion } from "framer-motion";
import { useAppState } from "@/context/AppContext";
import { events, sports, cities } from "@/data/sportsData";
import { Calendar, MapPin, Clock, Users, IndianRupee } from "lucide-react";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const typeColors: Record<string, string> = {
  tournament: "bg-primary/10 text-primary",
  coaching: "bg-accent/10 text-accent",
  practice: "bg-warning/10 text-warning",
  league: "bg-destructive/10 text-destructive",
};

const Events = () => {
  const { selectedSport, selectedCity } = useAppState();
  const [timeFilter, setTimeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredEvents = useMemo(() => {
    let items = events;
    if (selectedSport) items = items.filter((e) => e.sportId === selectedSport);
    if (selectedCity) items = items.filter((e) => e.city === selectedCity);
    if (typeFilter !== "all") items = items.filter((e) => e.type === typeFilter);
    return items;
  }, [selectedSport, selectedCity, typeFilter]);

  const currentSport = sports.find((s) => s.id === selectedSport);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">
            {currentSport ? `${currentSport.name} Events` : "All Events"}
            {selectedCity && <span className="text-primary"> in {selectedCity}</span>}
          </h1>
          <p className="text-muted-foreground">Discover tournaments, coaching, and practice sessions near you</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="tournament">Tournaments</SelectItem>
              <SelectItem value="coaching">Coaching</SelectItem>
              <SelectItem value="practice">Practice</SelectItem>
              <SelectItem value="league">Leagues</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Events List */}
        <div className="grid gap-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-display font-semibold text-foreground mb-2">No events found</h2>
              <p className="text-muted-foreground">Try changing your sport or city filters</p>
            </div>
          ) : (
            filteredEvents.map((event, i) => {
              const sport = sports.find((s) => s.id === event.sportId);
              const spotsLeft = event.maxParticipants - event.registered;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group p-6 rounded-2xl border border-border bg-gradient-card hover:border-primary/30 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Date Badge */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                      <span className="text-xs text-primary font-medium">
                        {new Date(event.date).toLocaleDateString("en", { month: "short" })}
                      </span>
                      <span className="text-xl font-display font-bold text-primary">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>

                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${typeColors[event.type]}`}>
                          {event.type}
                        </span>
                        {sport && (
                          <span className="text-xs text-muted-foreground">{sport.name}</span>
                        )}
                      </div>
                      <h3 className="font-display font-semibold text-lg text-foreground mb-2">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{event.time}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.venue}, {event.city}</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{spotsLeft} spots left</span>
                        <span className="flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {event.entryFee === 0 ? <span className="text-primary font-medium">Free</span> : formatINR(event.entryFee)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;
