import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { mockUsers, User } from "../utils/mockData";

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const matchedUser = mockUsers.find(
      (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password,
    );

    if (!matchedUser) {
      setError(
        "Invalid username or password. Try admin@church.com / Admin@123, manager@church.com / Manager@123, or john.smith@church.com / Member@123.",
      );
      return;
    }

    setError("");
    onLogin(matchedUser);
    if (matchedUser.role === "superadmin") {
      navigate("/dashboard");
    } else if (matchedUser.role === "manager") {
      navigate("/workers");
    } else {
      navigate("/member");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center">Attendance System</CardTitle>
        <CardDescription className="text-center">
          {showForgotPassword ? "Reset your password" : "Enter your credentials to access your account"}
        </CardDescription>
      </CardHeader>
      
      {showForgotPassword ? (
        <form onSubmit={(e) => {
          e.preventDefault();
          alert("Password reset link has been sent to your email");
          setShowForgotPassword(false);
        }}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="name@example.com"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full">
              Send Reset Link
            </Button>
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setShowForgotPassword(false)}
            >
              Back to login
            </button>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Username / Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="username or email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" defaultChecked />
              <Label htmlFor="remember" className="font-normal cursor-pointer">Remember Password</Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
