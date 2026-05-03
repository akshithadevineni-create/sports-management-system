export type StoredUser = {
  name: string;
  email?: string;
  phone?: string;
  password: string;
};

export type PublicUser = Omit<StoredUser, "password">;

export type AuthMethod = "email" | "phone";
export type AdminUser = PublicUser & { role: "admin" };

const AUTH_KEY = "auth";
const USER_KEY = "user";
const USERS_KEY = "authUsers";
const USER_EMAIL_KEY = "userEmail";

const defaultUsers: StoredUser[] = [
  { name: "Ananya", email: "ananya@sports.com", phone: "9876543210", password: "123456" },
  { name: "Adithi", email: "adithi@sports.com", phone: "9876501234", password: "123456" },
  { name: "Akshitha", email: "akshitha@sports.com", phone: "9876505678", password: "123456" },
];

const adminUser: StoredUser = {
  name: "Sports Admin",
  email: "admin@sports.com",
  phone: "9999999999",
  password: "admin123",
};

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizePhone = (value: string) => value.replace(/\D/g, "").slice(-10);
export const isValidEmail = (value: string) => emailPattern.test(normalizeEmail(value));

const toPublicUser = (user: StoredUser): PublicUser => ({
  name: user.name,
  email: user.email,
  phone: user.phone,
});

export const getStoredUsers = (): StoredUser[] => {
  if (!canUseStorage()) {
    return defaultUsers;
  }

  const storedUsers = window.localStorage.getItem(USERS_KEY);
  if (!storedUsers) {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }

  try {
    const parsedUsers = JSON.parse(storedUsers) as StoredUser[];
    return parsedUsers.length > 0 ? parsedUsers : defaultUsers;
  } catch {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
};

const saveUsers = (users: StoredUser[]) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getCurrentUser = (): PublicUser | null => {
  if (!canUseStorage()) {
    return null;
  }

  const storedUser = window.localStorage.getItem(USER_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as PublicUser;
  } catch {
    return null;
  }
};

export const getCurrentUserKey = () => {
  const user = getCurrentUser();

  if (user?.email) {
    return `email:${user.email.trim().toLowerCase()}`;
  }

  if (user?.phone) {
    return `phone:${normalizePhone(user.phone)}`;
  }

  return null;
};

const persistSession = (user: StoredUser) => {
  if (!canUseStorage()) {
    return;
  }

  const publicUser = toPublicUser(user);
  window.localStorage.setItem(AUTH_KEY, "true");
  window.localStorage.setItem(USER_KEY, JSON.stringify(publicUser));
  if (user.email) {
    window.localStorage.setItem(USER_EMAIL_KEY, user.email);
  } else {
    window.localStorage.removeItem(USER_EMAIL_KEY);
  }
};

export const clearSession = () => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(USER_EMAIL_KEY);
};

export const signIn = ({
  method,
  identifier,
  password,
}: {
  method: AuthMethod;
  identifier: string;
  password: string;
}): { ok: true; user: PublicUser } | { ok: false; message: string } => {
  const normalizedIdentifier = method === "email" ? normalizeEmail(identifier) : normalizePhone(identifier);
  const normalizedPassword = password.trim();
  const users = getStoredUsers();

  if (!normalizedIdentifier) {
    return {
      ok: false,
      message: method === "email" ? "Please enter your email address" : "Please enter your phone number",
    };
  }

  if (method === "email" && !isValidEmail(normalizedIdentifier)) {
    return { ok: false, message: "Please enter a valid email address" };
  }

  if (method === "phone" && normalizedIdentifier.length !== 10) {
    return { ok: false, message: "Please enter a valid 10-digit phone number" };
  }

  if (!normalizedPassword) {
    return { ok: false, message: "Please enter your password" };
  }

  const matchedUserByIdentifier = users.find((item) => {
    const userIdentifier = method === "email" ? normalizeEmail(item.email || "") : normalizePhone(item.phone || "");
    return userIdentifier === normalizedIdentifier;
  });

  if (!matchedUserByIdentifier) {
    return {
      ok: false,
      message: method === "email" ? "No account found with this email address" : "No account found with this phone number",
    };
  }

  if (matchedUserByIdentifier.password !== normalizedPassword) {
    return { ok: false, message: "Incorrect password" };
  }

  persistSession(matchedUserByIdentifier);
  return { ok: true, user: toPublicUser(matchedUserByIdentifier) };
};

export const signInAdmin = ({
  email,
  password,
}: {
  email: string;
  password: string;
}): { ok: true; user: AdminUser } | { ok: false; message: string } => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = password.trim();

  if (!normalizedEmail) {
    return { ok: false, message: "Please enter your admin email address" };
  }

  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, message: "Please enter a valid admin email address" };
  }

  if (!normalizedPassword) {
    return { ok: false, message: "Please enter your admin password" };
  }

  if (normalizedEmail !== adminUser.email || normalizedPassword !== adminUser.password) {
    return { ok: false, message: "Invalid admin credentials" };
  }

  persistSession(adminUser);
  return { ok: true, user: { ...toPublicUser(adminUser), role: "admin" } };
};

export const signUp = ({
  name,
  method,
  identifier,
  password,
}: {
  name: string;
  method: AuthMethod;
  identifier: string;
  password: string;
}): { ok: true; user: PublicUser } | { ok: false; message: string } => {
  const normalizedName = name.trim();
  const normalizedPassword = password.trim();
  const normalizedEmail = method === "email" ? normalizeEmail(identifier) : undefined;
  const normalizedPhone = method === "phone" ? normalizePhone(identifier) : undefined;

  if (!normalizedName) {
    return { ok: false, message: "Name is required" };
  }

  if (method === "email" && !normalizedEmail) {
    return { ok: false, message: "Email is required" };
  }

  if (method === "email" && normalizedEmail && !isValidEmail(normalizedEmail)) {
    return { ok: false, message: "Enter a valid email address" };
  }

  if (method === "phone" && normalizedPhone?.length !== 10) {
    return { ok: false, message: "Enter a valid 10-digit phone number" };
  }

  if (normalizedPassword.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters" };
  }

  const users = getStoredUsers();
  const isDuplicate = users.some((user) => {
    if (normalizedEmail) {
      return normalizeEmail(user.email || "") === normalizedEmail;
    }

    if (normalizedPhone) {
      return normalizePhone(user.phone || "") === normalizedPhone;
    }

    return false;
  });

  if (isDuplicate) {
    return {
      ok: false,
      message: `${method === "email" ? "Email" : "Phone number"} already registered`,
    };
  }

  const user: StoredUser = {
    name: normalizedName,
    password: normalizedPassword,
    email: normalizedEmail,
    phone: normalizedPhone,
  };

  saveUsers([...users, user]);
  persistSession(user);
  return { ok: true, user: toPublicUser(user) };
};
