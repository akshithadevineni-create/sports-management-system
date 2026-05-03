import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { useAuth, UserRole } from "@/contexts/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: UserRole;
};

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole === "admin" && user.role === "user") {
    toast.error("Access denied.");
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === "user" && user.role === "admin") {
    toast.error("Access denied.");
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
