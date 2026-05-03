import { useCallback, useEffect, useState } from "react";
import { getCurrentUserKey } from "@/lib/auth";

const TEAMS_STORAGE_KEY = "sports_teams";
const TEAMS_UPDATED_EVENT = "sports-teams-updated";

export const sportTypes = ["Football", "Basketball", "Cricket", "Tennis", "Swimming", "Athletics"] as const;

export type SportType = (typeof sportTypes)[number];

export type Team = {
  id: string;
  name: string;
  sportType: SportType;
  captainName: string;
  captainEmail?: string;
  captainKey?: string | null;
  playerCount: number;
  description?: string;
  members?: Array<{
    userKey: string;
    name: string;
    email?: string;
    role: "captain" | "member";
    joinedAt: string;
  }>;
  createdAt: string;
};

const demoTeams: Team[] = [
  { id: "demo-team-1", name: "City Strikers", sportType: "Football", captainName: "Aarav Sharma", playerCount: 16, description: "Fast counter-attacking football squad.", createdAt: "2026-04-01T09:00:00.000Z" },
  { id: "demo-team-2", name: "Metro United", sportType: "Football", captainName: "Kabir Rao", playerCount: 18, description: "Balanced lineup with a strong midfield.", createdAt: "2026-04-01T09:05:00.000Z" },
  { id: "demo-team-3", name: "Northside FC", sportType: "Football", captainName: "Dev Mehta", playerCount: 15, description: "Youth-heavy team with high pressing.", createdAt: "2026-04-01T09:10:00.000Z" },
  { id: "demo-team-4", name: "Harbor Wolves", sportType: "Football", captainName: "Nikhil Sethi", playerCount: 17, description: "Physical defensive unit.", createdAt: "2026-04-01T09:15:00.000Z" },
  { id: "demo-team-5", name: "Skyline Hoopers", sportType: "Basketball", captainName: "Riya Kapoor", playerCount: 10, description: "Perimeter shooting specialists.", createdAt: "2026-04-01T09:20:00.000Z" },
  { id: "demo-team-6", name: "Downtown Dunkers", sportType: "Basketball", captainName: "Arjun Nair", playerCount: 11, description: "Transition-first basketball team.", createdAt: "2026-04-01T09:25:00.000Z" },
  { id: "demo-team-7", name: "Court Kings", sportType: "Basketball", captainName: "Ishaan Bedi", playerCount: 9, description: "Half-court execution and size.", createdAt: "2026-04-01T09:30:00.000Z" },
  { id: "demo-team-8", name: "Rim Runners", sportType: "Basketball", captainName: "Meera Shah", playerCount: 12, description: "Deep bench and quick rotations.", createdAt: "2026-04-01T09:35:00.000Z" },
  { id: "demo-team-9", name: "Royal Batsmen", sportType: "Cricket", captainName: "Vivaan Iyer", playerCount: 14, description: "Top-order batting strength.", createdAt: "2026-04-01T09:40:00.000Z" },
  { id: "demo-team-10", name: "Spin Masters", sportType: "Cricket", captainName: "Sara Menon", playerCount: 13, description: "Spin-heavy bowling attack.", createdAt: "2026-04-01T09:45:00.000Z" },
  { id: "demo-team-11", name: "Boundary Riders", sportType: "Cricket", captainName: "Yash Gupta", playerCount: 15, description: "Aggressive T20 side.", createdAt: "2026-04-01T09:50:00.000Z" },
  { id: "demo-team-12", name: "Seam Chargers", sportType: "Cricket", captainName: "Anaya Das", playerCount: 14, description: "Pace bowling and athletic fielding.", createdAt: "2026-04-01T09:55:00.000Z" },
  { id: "demo-team-13", name: "Baseline Aces", sportType: "Tennis", captainName: "Tara Joshi", playerCount: 6, description: "Singles-focused tennis squad.", createdAt: "2026-04-01T10:00:00.000Z" },
  { id: "demo-team-14", name: "Net Ninjas", sportType: "Tennis", captainName: "Rehan Malik", playerCount: 5, description: "Doubles specialists.", createdAt: "2026-04-01T10:05:00.000Z" },
  { id: "demo-team-15", name: "Topspin Titans", sportType: "Tennis", captainName: "Kiara Sen", playerCount: 7, description: "Heavy baseline play.", createdAt: "2026-04-01T10:10:00.000Z" },
  { id: "demo-team-16", name: "Serve Squad", sportType: "Tennis", captainName: "Om Prakash", playerCount: 6, description: "Big servers and quick finishes.", createdAt: "2026-04-01T10:15:00.000Z" },
  { id: "demo-team-17", name: "Aqua Jets", sportType: "Swimming", captainName: "Naina Verma", playerCount: 8, description: "Sprint freestyle unit.", createdAt: "2026-04-01T10:20:00.000Z" },
  { id: "demo-team-18", name: "Blue Current", sportType: "Swimming", captainName: "Aditya Bose", playerCount: 9, description: "Strong relay swimmers.", createdAt: "2026-04-01T10:25:00.000Z" },
  { id: "demo-team-19", name: "Lane Leaders", sportType: "Swimming", captainName: "Maya Reddy", playerCount: 7, description: "Medley and endurance group.", createdAt: "2026-04-01T10:30:00.000Z" },
  { id: "demo-team-20", name: "Wave Racers", sportType: "Swimming", captainName: "Rohan Pillai", playerCount: 8, description: "Backstroke and butterfly specialists.", createdAt: "2026-04-01T10:35:00.000Z" },
  { id: "demo-team-21", name: "Track Blazers", sportType: "Athletics", captainName: "Aisha Khan", playerCount: 12, description: "Short sprint and relay athletes.", createdAt: "2026-04-01T10:40:00.000Z" },
  { id: "demo-team-22", name: "Marathon Minds", sportType: "Athletics", captainName: "Kunal Jain", playerCount: 10, description: "Distance running squad.", createdAt: "2026-04-01T10:45:00.000Z" },
  { id: "demo-team-23", name: "Jump Crew", sportType: "Athletics", captainName: "Pooja Nambiar", playerCount: 9, description: "Jump and multi-event athletes.", createdAt: "2026-04-01T10:50:00.000Z" },
  { id: "demo-team-24", name: "Relay Rockets", sportType: "Athletics", captainName: "Neel Arora", playerCount: 11, description: "Relay-first competition group.", createdAt: "2026-04-01T10:55:00.000Z" },
  { id: "demo-team-25", name: "Capital Kickers", sportType: "Football", captainName: "Mihir Patel", playerCount: 16, description: "Compact shape and wing play.", createdAt: "2026-04-01T11:00:00.000Z" },
  { id: "demo-team-26", name: "Paint Protectors", sportType: "Basketball", captainName: "Avni Rao", playerCount: 10, description: "Defense-led basketball unit.", createdAt: "2026-04-01T11:05:00.000Z" },
  { id: "demo-team-27", name: "Powerplay XI", sportType: "Cricket", captainName: "Tanvi Kulkarni", playerCount: 13, description: "Explosive opening partnership.", createdAt: "2026-04-01T11:10:00.000Z" },
  { id: "demo-team-28", name: "Drop Shot Club", sportType: "Tennis", captainName: "Zara Ali", playerCount: 5, description: "Tactical touch and net play.", createdAt: "2026-04-01T11:15:00.000Z" },
  { id: "demo-team-29", name: "Pool Panthers", sportType: "Swimming", captainName: "Krish Anand", playerCount: 8, description: "Relay depth across strokes.", createdAt: "2026-04-01T11:20:00.000Z" },
  { id: "demo-team-30", name: "Sprint Syndicate", sportType: "Athletics", captainName: "Lavanya Singh", playerCount: 12, description: "Explosive starts and speed work.", createdAt: "2026-04-01T11:25:00.000Z" },
  { id: "demo-team-31", name: "East End Rovers", sportType: "Football", captainName: "Samar Gill", playerCount: 16, description: "Quick overlaps and direct attacking.", createdAt: "2026-04-01T11:30:00.000Z" },
  { id: "demo-team-32", name: "River Plate Juniors", sportType: "Football", captainName: "Ira Chopra", playerCount: 17, description: "Possession-first football team.", createdAt: "2026-04-01T11:35:00.000Z" },
  { id: "demo-team-33", name: "Final Whistle FC", sportType: "Football", captainName: "Raghav Bansal", playerCount: 18, description: "Late-game specialists.", createdAt: "2026-04-01T11:40:00.000Z" },
  { id: "demo-team-34", name: "Fastbreak Five", sportType: "Basketball", captainName: "Sana Mirza", playerCount: 10, description: "High-tempo guard play.", createdAt: "2026-04-01T11:45:00.000Z" },
  { id: "demo-team-35", name: "Arc Angels", sportType: "Basketball", captainName: "Neil Dsouza", playerCount: 9, description: "Three-point shooting depth.", createdAt: "2026-04-01T11:50:00.000Z" },
  { id: "demo-team-36", name: "Glass Cleaners", sportType: "Basketball", captainName: "Dia Thomas", playerCount: 11, description: "Rebounding and second chances.", createdAt: "2026-04-01T11:55:00.000Z" },
  { id: "demo-team-37", name: "Yorker Yard", sportType: "Cricket", captainName: "Manav Suri", playerCount: 14, description: "Death-over bowling strength.", createdAt: "2026-04-01T12:00:00.000Z" },
  { id: "demo-team-38", name: "Cover Drive Club", sportType: "Cricket", captainName: "Myra Saxena", playerCount: 13, description: "Technical batting lineup.", createdAt: "2026-04-01T12:05:00.000Z" },
  { id: "demo-team-39", name: "Wicket Warriors", sportType: "Cricket", captainName: "Harsh Vora", playerCount: 15, description: "All-rounders across the order.", createdAt: "2026-04-01T12:10:00.000Z" },
  { id: "demo-team-40", name: "Rally Rebels", sportType: "Tennis", captainName: "Anika Roy", playerCount: 6, description: "Long-rally match control.", createdAt: "2026-04-01T12:15:00.000Z" },
  { id: "demo-team-41", name: "Match Point Mob", sportType: "Tennis", captainName: "Kian Fernandes", playerCount: 5, description: "Pressure-point specialists.", createdAt: "2026-04-01T12:20:00.000Z" },
  { id: "demo-team-42", name: "Court Comets", sportType: "Tennis", captainName: "Misha Dutta", playerCount: 7, description: "Quick feet and sharp returns.", createdAt: "2026-04-01T12:25:00.000Z" },
  { id: "demo-team-43", name: "Deep End Dashers", sportType: "Swimming", captainName: "Kabya Nanda", playerCount: 8, description: "Sprint relay team.", createdAt: "2026-04-01T12:30:00.000Z" },
  { id: "demo-team-44", name: "Freestyle Flyers", sportType: "Swimming", captainName: "Armaan Khurana", playerCount: 9, description: "Freestyle and medley depth.", createdAt: "2026-04-01T12:35:00.000Z" },
  { id: "demo-team-45", name: "Turn Masters", sportType: "Swimming", captainName: "Siya Mathew", playerCount: 7, description: "Efficient turns and underwater speed.", createdAt: "2026-04-01T12:40:00.000Z" },
  { id: "demo-team-46", name: "Hurdle Heroes", sportType: "Athletics", captainName: "Pranav Shah", playerCount: 10, description: "Hurdles and sprint events.", createdAt: "2026-04-01T12:45:00.000Z" },
  { id: "demo-team-47", name: "Field Force", sportType: "Athletics", captainName: "Rhea Banerjee", playerCount: 11, description: "Throws and jumps specialists.", createdAt: "2026-04-01T12:50:00.000Z" },
  { id: "demo-team-48", name: "Pace Unit", sportType: "Athletics", captainName: "Dhruv Chawla", playerCount: 12, description: "Middle-distance pace control.", createdAt: "2026-04-01T12:55:00.000Z" },
];

const mergeDemoTeams = (storedTeams: Team[]) => {
  const storedIds = new Set(storedTeams.map((team) => team.id));
  const missingDemoTeams = demoTeams.filter((team) => !storedIds.has(team.id));
  const nextTeams = [...storedTeams, ...missingDemoTeams];

  if (missingDemoTeams.length > 0) {
    window.localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(nextTeams));
  }

  return nextTeams;
};

const normalizeTeam = (team: Team): Team => {
  const normalizedCaptainKey = team.captainKey ?? null;
  const existingMembers = team.members || [];
  const hasCaptainMember = normalizedCaptainKey
    ? existingMembers.some((member) => member.userKey === normalizedCaptainKey)
    : existingMembers.some((member) => member.role === "captain" && member.name === team.captainName);

  const members =
    hasCaptainMember || !normalizedCaptainKey
      ? existingMembers
      : [
          {
            userKey: normalizedCaptainKey,
            name: team.captainName,
            email: team.captainEmail,
            role: "captain" as const,
            joinedAt: team.createdAt,
          },
          ...existingMembers,
        ];

  return {
    ...team,
    captainKey: normalizedCaptainKey,
    members,
  };
};

const readStoredTeams = (): Team[] => {
  if (typeof window === "undefined") return [];

  try {
    const storedTeams = window.localStorage.getItem(TEAMS_STORAGE_KEY);
    if (!storedTeams) {
      window.localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(demoTeams));
      return demoTeams;
    }

    const parsedTeams = (JSON.parse(storedTeams) as Team[]).map(normalizeTeam);
    if (parsedTeams.length === 0) {
      window.localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(demoTeams));
      return demoTeams;
    }

    return mergeDemoTeams(parsedTeams);
  } catch {
    return demoTeams;
  }
};

const writeStoredTeams = (teams: Team[]) => {
  window.localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
  window.dispatchEvent(new Event(TEAMS_UPDATED_EVENT));
};

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>(() => readStoredTeams());

  const refreshTeams = useCallback(() => {
    setTeams(readStoredTeams());
  }, []);

  useEffect(() => {
    const handleTeamsUpdate = () => refreshTeams();

    window.addEventListener("storage", handleTeamsUpdate);
    window.addEventListener(TEAMS_UPDATED_EVENT, handleTeamsUpdate);

    return () => {
      window.removeEventListener("storage", handleTeamsUpdate);
      window.removeEventListener(TEAMS_UPDATED_EVENT, handleTeamsUpdate);
    };
  }, [refreshTeams]);

  const addTeam = useCallback((team: Team) => {
    const nextTeams = [...readStoredTeams(), normalizeTeam(team)];
    writeStoredTeams(nextTeams);
    setTeams(nextTeams);
  }, []);

  const joinTeam = useCallback(
    (teamId: string, member: { name: string; email?: string }) => {
      const userKey = getCurrentUserKey();
      if (!userKey) return false;

      const nextTeams = readStoredTeams().map((team) => {
        if (team.id !== teamId) return team;
        if (team.members?.some((existingMember) => existingMember.userKey === userKey)) return team;

        return normalizeTeam({
          ...team,
          members: [
            ...(team.members || []),
            {
              userKey,
              name: member.name,
              email: member.email,
              role: "member",
              joinedAt: new Date().toISOString(),
            },
          ],
        });
      });

      writeStoredTeams(nextTeams);
      setTeams(nextTeams);
      return true;
    },
    [],
  );

  const getUserTeams = useCallback((userKey: string | null) => {
    if (!userKey) return [];
    return readStoredTeams().filter((team) => team.members?.some((member) => member.userKey === userKey));
  }, []);

  return { teams, addTeam, joinTeam, getUserTeams, refreshTeams };
};
