"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Terminal, UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/components/auth-context";

// Form schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "signup";
  onModeChange: (mode: "login" | "signup") => void;
}

export function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login, register } = useAuth();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  // Email/Password Login with Spring Boot Backend
  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    setError("");

    try {
      await login(data.email, data.password);
      loginForm.reset();
      onClose();
      router.push("/dashboard");
      console.log("🔐 Login successful, redirecting to dashboard");
    } catch (err: any) {
      const errorMessage = err.message || "Login failed. Please try again.";
      setError(errorMessage);
      console.error("❌ Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Email/Password Signup with Spring Boot Backend
  const handleSignup = async (data: SignupForm) => {
    setIsLoading(true);
    setError("");

    try {
      await register(data.email, data.password, data.fullName);
      signupForm.reset();
      onClose();
      router.push("/dashboard");
      console.log("✅ Registration successful, redirecting to dashboard");
    } catch (err: any) {
      const errorMessage = err.message || "Registration failed. Please try again.";
      setError(errorMessage);
      console.error("❌ Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-green-500/30 text-green-400 font-mono">
        <DialogHeader>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-center text-green-400 flex items-center justify-center space-x-2">
            <Terminal className="h-5 w-5" />
            <span>root@edos-shield: ~/{mode}</span>
          </DialogTitle>
        </DialogHeader>

        <Card className="border-green-500/30 bg-black/50">
          <CardHeader className="text-center">
            <CardTitle className="text-lg font-mono text-white flex items-center justify-center space-x-2">
              {mode === "login" ? (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>$ ./authenticate --secure</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>$ ./register --new-user</span>
                </>
              )}
            </CardTitle>
            <CardDescription className="text-green-300 font-mono text-sm">
              {mode === "login" 
                ? "# Accessing secure terminal session via Spring Boot Backend" 
                : "# Creating new security clearance with backend authentication"
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Badge
                variant="destructive"
                className="w-full justify-center py-2 font-mono bg-red-500/20 text-red-300 border-red-500/30"
              >
                [ERROR] {error}
              </Badge>
            )}

            {/* Email/Password Form */}
            {mode === "login" ? (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-green-400 font-mono text-sm">
                    --email
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-green-500 font-mono text-sm">@</span>
                    <Input
                      id="email"
                      type="email"
                      placeholder="security@edos.dev"
                      className="pl-8 bg-black border-green-500/30 text-green-400 placeholder:text-green-600 font-mono focus:border-green-500"
                      {...loginForm.register("email")}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-400 font-mono"># {loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-green-400 font-mono text-sm">
                    --password
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-green-500 font-mono text-sm">$</span>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-8 pr-10 bg-black border-green-500/30 text-green-400 placeholder:text-green-600 font-mono focus:border-green-500"
                      {...loginForm.register("password")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-green-500 hover:text-green-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-400 font-mono"># {loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-500 text-black hover:bg-green-400 font-mono font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? "$ authenticating..." : "$ execute --login"}
                </Button>
              </form>
            ) : (
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-green-400 font-mono text-sm">
                    --full-name
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-green-500 font-mono text-sm">{'>'}</span>
                    <Input
                      id="fullName"
                      placeholder="John Security"
                      className="pl-8 bg-black border-green-500/30 text-green-400 placeholder:text-green-600 font-mono focus:border-green-500"
                      {...signupForm.register("fullName")}
                    />
                  </div>
                  {signupForm.formState.errors.fullName && (
                    <p className="text-sm text-red-400 font-mono"># {signupForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-green-400 font-mono text-sm">
                    --email
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-green-500 font-mono text-sm">@</span>
                    <Input
                      id="email"
                      type="email"
                      placeholder="security@edos.dev"
                      className="pl-8 bg-black border-green-500/30 text-green-400 placeholder:text-green-600 font-mono focus:border-green-500"
                      {...signupForm.register("email")}
                    />
                  </div>
                  {signupForm.formState.errors.email && (
                    <p className="text-sm text-red-400 font-mono"># {signupForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-green-400 font-mono text-sm">
                    --password
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-green-500 font-mono text-sm">$</span>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      className="pl-8 pr-10 bg-black border-green-500/30 text-green-400 placeholder:text-green-600 font-mono focus:border-green-500"
                      {...signupForm.register("password")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-green-500 hover:text-green-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {signupForm.formState.errors.password && (
                    <p className="text-sm text-red-400 font-mono"># {signupForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-500 text-black hover:bg-green-400 font-mono font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? "$ creating user..." : "$ execute --register"}
                </Button>
              </form>
            )}

            <div className="text-center text-sm border-t border-green-500/30 pt-4">
              <span className="text-green-500 font-mono">
                {mode === "login" ? "# No clearance? " : "# Already authenticated? "}
              </span>
              <Button
                variant="link"
                className="p-0 text-green-400 hover:text-green-300 font-mono underline"
                onClick={() => onModeChange(mode === "login" ? "signup" : "login")}
              >
                ./{mode === "login" ? "register" : "login"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}