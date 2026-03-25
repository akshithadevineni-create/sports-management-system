import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "@/components/ThemeToggle";

const users = [
  { email: "ananya@sports.com", password: "123456", name: "Ananya" },
  { email: "adithi@sports.com", password: "123456", name: "Adithi" },
  { email: "akshitha@sports.com", password: "123456", name: "Akshitha" },
];

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (localStorage.getItem("auth") === "true") {
    return <Navigate to="/" replace />;
  }

  const handleLogin = () => {
    const user = users.find((item) => item.email === email && item.password === password);

    if (!user) {
      setError("Invalid credentials");
      return;
    }

    localStorage.setItem("auth", "true");
    localStorage.setItem("userEmail", email);
    localStorage.setItem("user", JSON.stringify({ email: user.email, name: user.name }));
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Login</h1>
        <p className="text-muted-foreground mb-6">Sign in to continue to Sports+</p>

        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={handleLogin}>
            Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
