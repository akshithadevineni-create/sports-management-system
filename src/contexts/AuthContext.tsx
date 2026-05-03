import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import { clearSession, getCurrentUser, PublicUser } from "@/lib/auth";

export type UserRole = "admin" | "user";

export type AuthUser = {
  name: string;
  email: string;
  role: UserRole;
};

type AuthContextValue = {
  user: AuthUser | null;
  login: (user: PublicUser & { role?: UserRole }) => void;
  logout: () => void;
};

const AUTH_USER_KEY = "sports_auth_user";

const toAuthUser = (user: PublicUser & { role?: UserRole }): AuthUser => ({
  name: user.name,
  email: user.email || `${user.phone || "member"}@sports.local`,
  role: user.role || "user",
});

const readAuthUser = (): AuthUser | null => {
  try {
    const storedAuthUser = localStorage.getItem(AUTH_USER_KEY);
    if (storedAuthUser) {
      const parsedUser = JSON.parse(storedAuthUser) as AuthUser;
      if (parsedUser.role === "admin" && parsedUser.email.toLowerCase() !== "admin@sports.com") {
        const downgradedUser: AuthUser = { ...parsedUser, role: "user" };
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(downgradedUser));
        return downgradedUser;
      }

      return parsedUser;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) return null;

    const authUser = toAuthUser(currentUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
    return authUser;
  } catch {
    return null;
  }
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => readAuthUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: (nextUser) => {
        const authUser = toAuthUser(nextUser);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
        setUser(authUser);
      },
      logout: () => {
        localStorage.removeItem(AUTH_USER_KEY);
        clearSession();
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
