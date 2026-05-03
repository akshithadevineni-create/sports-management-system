import { Activity, Dribbble, CircleDot, Target, Volleyball, Bike, Waves, Dumbbell } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ecommerceProducts } from "./ecommerceProducts";

export interface Sport {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  image: string;
}

export interface Product {
  id: string;
  sportId: string;
  name: string;
  category: "equipment" | "clothing" | "accessories";
  price: number;
  brand: string;
  rating: number;
  image: string;
  description: string;
  tags?: string[];
}

export interface SportEvent {
  id: string;
  sportId: string;
  title: string;
  type: "tournament" | "coaching" | "practice" | "league";
  date: string;
  time: string;
  venue: string;
  city: string;
  organizer: string;
  entryFee: number;
  maxParticipants: number;
  registered: number;
  description: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
}

const USD_TO_INR = 83;

export const sports: Sport[] = [
  { id: "football", name: "Football", icon: Dribbble, color: "hsl(135 100% 55%)", image: "" },
  { id: "cricket", name: "Cricket", icon: CircleDot, color: "hsl(45 93% 58%)", image: "" },
  { id: "basketball", name: "Basketball", icon: Dribbble, color: "hsl(20 90% 55%)", image: "" },
  { id: "tennis", name: "Tennis", icon: Target, color: "hsl(200 90% 55%)", image: "" },
  { id: "badminton", name: "Badminton", icon: Volleyball, color: "hsl(300 80% 60%)", image: "" },
  { id: "cycling", name: "Cycling", icon: Bike, color: "hsl(0 80% 55%)", image: "" },
  { id: "swimming", name: "Swimming", icon: Waves, color: "hsl(190 90% 50%)", image: "" },
  { id: "gym", name: "Gym & Fitness", icon: Dumbbell, color: "hsl(270 80% 60%)", image: "" },
];

export const fallbackProducts: Product[] = [
  // Football
  { id: "p1", sportId: "football", name: "Pro Match Football", category: "equipment", price: 4149, brand: "Nike", rating: 4.8, image: "", description: "Official match ball with thermal bonding technology" },
  { id: "p2", sportId: "football", name: "Speed Boots X", category: "equipment", price: 10789, brand: "Adidas", rating: 4.7, image: "", description: "Lightweight speed boots with grip sole" },
  { id: "p3", sportId: "football", name: "Training Jersey", category: "clothing", price: 2904, brand: "Puma", rating: 4.5, image: "", description: "Breathable Dri-Fit training jersey" },
  { id: "p4", sportId: "football", name: "Shin Guards Pro", category: "accessories", price: 2074, brand: "Nike", rating: 4.6, image: "", description: "Lightweight protective shin guards" },
  { id: "p5", sportId: "football", name: "Goalkeeper Gloves", category: "equipment", price: 3734, brand: "Adidas", rating: 4.4, image: "", description: "Professional grip goalkeeper gloves" },
  { id: "p6", sportId: "football", name: "Training Cones Set", category: "accessories", price: 1244, brand: "Generic", rating: 4.3, image: "", description: "50-piece agility training cone set" },
  // Cricket
  { id: "p7", sportId: "cricket", name: "English Willow Bat", category: "equipment", price: 15769, brand: "Gray-Nicolls", rating: 4.9, image: "", description: "Grade 1 English willow cricket bat" },
  { id: "p8", sportId: "cricket", name: "Batting Pads", category: "equipment", price: 4979, brand: "SG", rating: 4.6, image: "", description: "Lightweight batting leg pads" },
  { id: "p9", sportId: "cricket", name: "Cricket Whites", category: "clothing", price: 3734, brand: "Kookaburra", rating: 4.5, image: "", description: "Classic cricket whites set" },
  { id: "p10", sportId: "cricket", name: "Batting Gloves", category: "accessories", price: 2904, brand: "SS", rating: 4.7, image: "", description: "Premium batting gloves with extra grip" },
  // Basketball
  { id: "p11", sportId: "basketball", name: "Indoor Basketball", category: "equipment", price: 3319, brand: "Spalding", rating: 4.8, image: "", description: "Official size indoor composite basketball" },
  { id: "p12", sportId: "basketball", name: "Court Shoes Elite", category: "equipment", price: 13279, brand: "Nike", rating: 4.9, image: "", description: "High-performance basketball shoes" },
  { id: "p13", sportId: "basketball", name: "Compression Shorts", category: "clothing", price: 2489, brand: "Under Armour", rating: 4.5, image: "", description: "Moisture-wicking compression shorts" },
  { id: "p14", sportId: "basketball", name: "Knee Sleeve", category: "accessories", price: 1659, brand: "McDavid", rating: 4.6, image: "", description: "Supportive knee compression sleeve" },
  // Tennis
  { id: "p15", sportId: "tennis", name: "Pro Staff Racket", category: "equipment", price: 19089, brand: "Wilson", rating: 4.9, image: "", description: "Professional carbon fiber tennis racket" },
  { id: "p16", sportId: "tennis", name: "Tennis Balls (Pack of 4)", category: "equipment", price: 829, brand: "Penn", rating: 4.7, image: "", description: "Championship extra-duty tennis balls" },
  { id: "p17", sportId: "tennis", name: "Performance Polo", category: "clothing", price: 4149, brand: "Lacoste", rating: 4.6, image: "", description: "UV-protective performance polo" },
  { id: "p18", sportId: "tennis", name: "Wristband Set", category: "accessories", price: 1079, brand: "Nike", rating: 4.4, image: "", description: "Absorbent terry cloth wristbands" },
  // Badminton
  { id: "p19", sportId: "badminton", name: "Carbon Racket", category: "equipment", price: 7469, brand: "Yonex", rating: 4.8, image: "", description: "Lightweight carbon fiber badminton racket" },
  { id: "p20", sportId: "badminton", name: "Feather Shuttlecocks", category: "equipment", price: 2074, brand: "Li-Ning", rating: 4.7, image: "", description: "Tournament grade feather shuttlecocks (12 pack)" },
];

export const products: Product[] = ecommerceProducts.length > 0 ? ecommerceProducts : fallbackProducts;

export const events: SportEvent[] = [
  { id: "e1", sportId: "football", title: "City Football Championship", type: "tournament", date: "2026-03-15", time: "09:00", venue: "Central Sports Complex", city: "Mumbai", organizer: "City Sports Federation", entryFee: 2075, maxParticipants: 64, registered: 31, description: "Annual city-wide football championship with prizes for top 3 teams" },
  { id: "e2", sportId: "football", title: "Weekend Football Coaching", type: "coaching", date: "2026-03-08", time: "07:00", venue: "Green Park Stadium", city: "Mumbai", organizer: "Coach Academy", entryFee: 1245, maxParticipants: 30, registered: 12, description: "Professional coaching session for intermediate players" },
  { id: "e3", sportId: "football", title: "Evening Practice Match", type: "practice", date: "2026-03-05", time: "18:00", venue: "Local Turf Arena", city: "Mumbai", organizer: "FootballBuddies", entryFee: 0, maxParticipants: 22, registered: 9, description: "Casual evening practice match open to all skill levels" },
  { id: "e4", sportId: "cricket", title: "Weekend Cricket League", type: "league", date: "2026-03-10", time: "08:00", venue: "Oval Ground", city: "Delhi", organizer: "Cricket Club India", entryFee: 2490, maxParticipants: 80, registered: 37, description: "Weekend T20 league running through March" },
  { id: "e5", sportId: "cricket", title: "Net Practice Session", type: "practice", date: "2026-03-06", time: "06:00", venue: "Sports Academy Nets", city: "Delhi", organizer: "Delhi Cricket Academy", entryFee: 830, maxParticipants: 20, registered: 7, description: "Morning net practice with bowling machine" },
  { id: "e6", sportId: "basketball", title: "3x3 Basketball Tournament", type: "tournament", date: "2026-03-20", time: "10:00", venue: "Indoor Sports Hall", city: "Bangalore", organizer: "Hoop Dreams", entryFee: 1660, maxParticipants: 32, registered: 15, description: "Fast-paced 3x3 basketball tournament" },
  { id: "e7", sportId: "tennis", title: "Mixed Doubles Open", type: "tournament", date: "2026-03-22", time: "09:00", venue: "Tennis Academy Courts", city: "Chennai", organizer: "TennisFirst", entryFee: 3320, maxParticipants: 16, registered: 6, description: "Open mixed doubles tournament" },
  { id: "e8", sportId: "badminton", title: "Badminton Singles League", type: "league", date: "2026-03-12", time: "18:00", venue: "Shuttle Zone Arena", city: "Hyderabad", organizer: "ShuttlePro", entryFee: 1245, maxParticipants: 24, registered: 10, description: "Monthly singles league for all skill levels" },
];

export const badges: Badge[] = [
  { id: "b1", name: "Weekend Warrior", description: "Attended 10+ weekend events", icon: "⚔️", earned: true },
  { id: "b2", name: "Consistent Player", description: "30-day activity streak", icon: "🔥", earned: true },
  { id: "b3", name: "Tournament Regular", description: "Registered for 5+ tournaments", icon: "🏆", earned: false },
  { id: "b4", name: "Night Owl", description: "10+ evening sessions logged", icon: "🌙", earned: true },
  { id: "b5", name: "Big Spender", description: `Spent ₹${500 * USD_TO_INR}+ on gear`, icon: "💰", earned: false },
  { id: "b6", name: "Social Butterfly", description: "Attended events in 3+ sports", icon: "🦋", earned: false },
];

export const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Kolkata", "Pune", "Ahmedabad"];

export const analyticsData = {
  eventsPerMonth: [
    { month: "Sep", events: 3 },
    { month: "Oct", events: 5 },
    { month: "Nov", events: 4 },
    { month: "Dec", events: 2 },
    { month: "Jan", events: 6 },
    { month: "Feb", events: 7 },
  ],
  spending: [
    { name: "Gear", value: 34860, fill: "hsl(135 100% 55%)" },
    { name: "Events", value: 14940, fill: "hsl(270 80% 60%)" },
  ],
  eveningActivity: [
    { week: "W1", sessions: 2 },
    { week: "W2", sessions: 4 },
    { week: "W3", sessions: 3 },
    { week: "W4", sessions: 5 },
    { week: "W5", sessions: 4 },
    { week: "W6", sessions: 6 },
    { week: "W7", sessions: 5 },
    { week: "W8", sessions: 7 },
  ],
  summary: {
    eventsRegistered: 27,
    eventsAttended: 23,
    gearSpent: 34860,
    eventSpent: 14940,
    eveningSessions: 36,
  },
};
