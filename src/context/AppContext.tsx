import React, { createContext, useContext, useState, ReactNode } from "react";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  type: "event" | "reminder";
  read: boolean;
}

const notifications: NotificationItem[] = [
  { id: 1, title: "Event Registration Successful", message: "You registered for Chennai Football League", time: "2 hours ago", type: "event", read: false },
  { id: 2, title: "New Event Nearby", message: "Cricket tournament in Chennai", time: "3 hours ago", type: "event", read: false },
  { id: 3, title: "Reminder", message: "Basketball practice tomorrow", time: "5 hours ago", type: "reminder", read: false },
  { id: 4, title: "Event Full", message: "Mumbai Marathon slots filled", time: "6 hours ago", type: "event", read: true },
  { id: 5, title: "New Coaching Session", message: "Badminton coaching available", time: "8 hours ago", type: "event", read: false },
  { id: 6, title: "Registration Confirmed", message: "You joined Delhi Basketball Cup", time: "10 hours ago", type: "event", read: true },
  { id: 7, title: "Reminder", message: "Tennis coaching today", time: "12 hours ago", type: "reminder", read: false },
  { id: 8, title: "New Event", message: "Hyderabad Football League open", time: "14 hours ago", type: "event", read: false },
  { id: 9, title: "Practice Session", message: "Morning run scheduled", time: "16 hours ago", type: "reminder", read: true },
  { id: 10, title: "Event Nearby", message: "Cricket nets available in Bangalore", time: "18 hours ago", type: "event", read: false },
  { id: 11, title: "League Update", message: "Match schedule updated", time: "20 hours ago", type: "event", read: false },
  { id: 12, title: "Reminder", message: "Gym session tomorrow", time: "22 hours ago", type: "reminder", read: true },
  { id: 13, title: "New Event", message: "Swimming competition announced", time: "1 day ago", type: "event", read: false },
  { id: 14, title: "Registration Confirmed", message: "You joined Chennai Marathon", time: "1 day ago", type: "event", read: false },
  { id: 15, title: "Reminder", message: "Cycling practice today", time: "1 day ago", type: "reminder", read: true },
  { id: 16, title: "Event Nearby", message: "Badminton tournament in Pune", time: "2 days ago", type: "event", read: false },
  { id: 17, title: "League Match", message: "Basketball match tomorrow", time: "2 days ago", type: "event", read: false },
  { id: 18, title: "Reminder", message: "Football practice", time: "2 days ago", type: "reminder", read: true },
  { id: 19, title: "New Event", message: "Delhi Cricket League", time: "2 days ago", type: "event", read: false },
  { id: 20, title: "Registration Confirmed", message: "You joined Tennis Open", time: "3 days ago", type: "event", read: false },
  { id: 21, title: "Reminder", message: "Evening run scheduled", time: "3 days ago", type: "reminder", read: true },
  { id: 22, title: "Event Nearby", message: "Gym competition", time: "3 days ago", type: "event", read: false },
  { id: 23, title: "New Event", message: "Mumbai Football Cup", time: "4 days ago", type: "event", read: false },
  { id: 24, title: "Reminder", message: "Badminton practice", time: "4 days ago", type: "reminder", read: true },
  { id: 25, title: "Registration Confirmed", message: "You joined Swimming League", time: "4 days ago", type: "event", read: false },
  { id: 26, title: "Event Nearby", message: "Cycling race in Bangalore", time: "5 days ago", type: "event", read: false },
  { id: 27, title: "Reminder", message: "Gym workout", time: "5 days ago", type: "reminder", read: true },
  { id: 28, title: "New Event", message: "Chennai Tennis Cup", time: "5 days ago", type: "event", read: false },
  { id: 29, title: "Registration Confirmed", message: "You joined Football League", time: "6 days ago", type: "event", read: false },
  { id: 30, title: "Reminder", message: "Morning cycling", time: "6 days ago", type: "reminder", read: true },
  { id: 31, title: "New Event", message: "Hyderabad Marathon", time: "1 week ago", type: "event", read: false },
  { id: 32, title: "Reminder", message: "Tennis practice", time: "1 week ago", type: "reminder", read: true },
];

interface AppState {
  selectedSport: string | null;
  selectedCity: string | null;
  cart: { productId: string; quantity: number }[];
  wishlist: string[];
  notifications: NotificationItem[];
  setSelectedSport: (sport: string | null) => void;
  setSelectedCity: (city: string | null) => void;
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  toggleNotificationRead: (id: number) => void;
  cartCount: number;
  unreadNotificationCount: number;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>(notifications);

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) return prev.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]);
  };

  const toggleNotificationRead = (id: number) => {
    setNotificationItems((prev) => prev.map((item) => item.id === id ? { ...item, read: !item.read } : item));
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const unreadNotificationCount = notificationItems.filter((item) => !item.read).length;

  return (
    <AppContext.Provider value={{ selectedSport, selectedCity, cart, wishlist, notifications: notificationItems, setSelectedSport, setSelectedCity, addToCart, removeFromCart, toggleWishlist, toggleNotificationRead, cartCount, unreadNotificationCount }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
};
