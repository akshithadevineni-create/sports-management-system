import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { sports, cities } from "@/data/sportsData";
import { MapPin, ChevronRight, Zap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SportSelection = () => {
  const navigate = useNavigate();
  const { selectedSport, selectedCity, setSelectedSport, setSelectedCity } = useAppState();

  const handleSportClick = (sportId: string) => {
    setSelectedSport(sportId);
  };

  const handleExplore = () => {
    if (selectedSport) navigate("/shop");
  };

  return (
    <div className="min-h-screen bg-gradient-hero pt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
          >
            <Zap className="w-4 h-4" />
            Your Sports. Your City. Your Game.
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-4">
            <span className="text-foreground">Choose Your</span>
            <br />
            <span className="text-gradient-primary">Sport</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Select a sport and your city to discover gear, events, and track your performance.
          </p>
        </motion.div>

        {/* City Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mb-12"
        >
          <div className="flex items-center gap-3 p-2 rounded-xl bg-card border border-border">
            <MapPin className="w-5 h-5 text-primary ml-3" />
            <Select value={selectedCity || ""} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-48 border-0 bg-transparent focus:ring-0">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Sport Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
          {sports.map((sport, i) => {
            const Icon = sport.icon;
            const isSelected = selectedSport === sport.id;
            return (
              <motion.button
                key={sport.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSportClick(sport.id)}
                className={`relative p-6 rounded-2xl border transition-all duration-300 text-left group ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border bg-gradient-card hover:border-primary/30"
                }`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                  style={{ backgroundColor: `${sport.color}20`, color: sport.color }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-foreground">{sport.name}</h3>
                {isSelected && (
                  <motion.div
                    layoutId="sport-check"
                    className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center"
                  >
                    <span className="text-primary-foreground text-xs">✓</span>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* CTA */}
        {selectedSport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <button
              onClick={handleExplore}
              className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-primary text-primary-foreground font-display font-semibold text-lg shadow-glow hover:shadow-[0_0_50px_-5px_hsl(135_100%_55%_/_0.5)] transition-shadow"
            >
              Explore {sports.find((s) => s.id === selectedSport)?.name}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SportSelection;
