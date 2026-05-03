import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "@/components/ThemeToggle";
import { AuthMethod, signIn, signInAdmin, signUp } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "admin">("signin");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (localStorage.getItem("auth") === "true") {
    return <Navigate to="/" replace />;
  }

  const resetForm = () => {
    setName("");
    setIdentifier("");
    setPassword("");
    setError("");
  };

  const handleModeChange = (nextMode: "signin" | "signup" | "admin") => {
    setMode(nextMode);
    resetForm();
  };

  const handleMethodChange = (nextMethod: AuthMethod) => {
    setMethod(nextMethod);
    setIdentifier("");
    setError("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result =
      mode === "admin"
        ? signInAdmin({ email: identifier, password })
        : mode === "signin"
          ? signIn({ method, identifier, password })
          : signUp({ name, method, identifier, password });

    if (!result.ok) {
      setError(result.message);
      return;
    }

    login(result.user);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => handleModeChange("signin")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mode === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("signup")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("admin")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mode === "admin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Admin
          </button>
        </div>

        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          {mode === "admin" ? "Admin login" : mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-muted-foreground mb-6">
          {mode === "admin"
            ? "Sign in with dedicated admin credentials"
            : mode === "signin"
            ? "Sign in with email or phone number and password"
            : "Sign up with email or phone number and password"}
        </p>

        {mode !== "admin" && (
        <div className="mb-4 flex rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => handleMethodChange("email")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              method === "email" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange("phone")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              method === "phone" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Phone
          </button>
        </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <Input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
          )}
          <Input
            type={mode === "admin" || method === "email" ? "email" : "tel"}
            placeholder={mode === "admin" || method === "email" ? "Email" : "Phone number"}
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setError("");
            }}
          />
          <Input
            type="password"
            placeholder={mode === "signup" ? "Create password" : mode === "admin" ? "Admin password" : "Password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" type="submit">
            {mode === "admin" ? "Sign In as Admin" : mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
          {mode === "admin" && (
            <p className="text-xs text-muted-foreground text-center">
              Admin demo: <span className="font-medium text-foreground">admin@sports.com</span> / admin123
            </p>
          )}
          {mode === "signin" && method === "phone" && (
            <p className="text-xs text-muted-foreground text-center">
              Demo phone login: <span className="font-medium text-foreground">9876543210</span> / 123456
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
