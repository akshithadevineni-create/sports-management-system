import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import SportSelection from "@/pages/SportSelection";
import Shop from "@/pages/Shop";
import Checkout from "@/pages/Checkout";
import Events from "@/pages/Events";
import EventCreation from "@/pages/EventCreation";
import TournamentRegistration from "@/pages/TournamentRegistration";
import Dashboard from "@/pages/Dashboard";
import Memberships from "@/pages/Memberships";
import Registrations from "@/pages/Registrations";
import Login from "@/pages/Login";
import Notifications from "@/pages/Notifications";
import Profile from "@/pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LoginRoute = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Login />;
};

const AppRoutes = () => {
  const location = useLocation();
  const showNavbar = location.pathname !== "/login";

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/" element={<ProtectedRoute requiredRole="user"><SportSelection /></ProtectedRoute>} />
        <Route path="/shop" element={<ProtectedRoute requiredRole="user"><Shop /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute requiredRole="user"><Checkout /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute requiredRole="user"><Events /></ProtectedRoute>} />
        <Route path="/event-creation" element={<ProtectedRoute requiredRole="admin"><EventCreation /></ProtectedRoute>} />
        <Route path="/tournament-registration" element={<ProtectedRoute requiredRole="user"><TournamentRegistration /></ProtectedRoute>} />
        <Route path="/registrations" element={<ProtectedRoute requiredRole="admin"><Registrations /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/memberships" element={<ProtectedRoute requiredRole="admin"><Memberships /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute requiredRole="user"><Profile /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
