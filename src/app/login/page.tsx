"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Loader2,
  Lock,
  User,
  Sparkles,
  Package,
  Printer,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LoginFormValues {
  username: string;
  password: string;
}

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description: "Smart analytics and demand forecasting",
  },
  {
    icon: Package,
    title: "Track Inventory",
    description: "Yarn, fabric & garment stock in real-time",
  },
  {
    icon: Printer,
    title: "Print Reports",
    description: "Production, dispatch & financial reports",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access",
    description: "Secure, granular permissions for every user",
  },
];

function FloatingParticles() {
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; size: number; duration: number; delay: number }[]
  >([]);

  useEffect(() => {
    const generated = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white/20 animate-pulse"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  // Check URL for error from NextAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      setLoginError("Invalid username or password");
    }
  }, []);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setLoginError("");

    try {
      // Step 1: Get CSRF token
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();

      // Step 2: POST credentials directly
      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          csrfToken,
          username: data.username,
          password: data.password,
          json: "true",
        }),
        redirect: "follow",
      });

      // Step 3: Check if session was created
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user) {
        toast.success("Signed in successfully");
        window.location.href = "/dashboard";
      } else {
        setLoginError("Invalid username or password");
        setIsLoading(false);
      }
    } catch {
      setLoginError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[100px]" />

        <FloatingParticles />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-lg font-bold tracking-tight">
              B
            </div>
            <span className="text-sm font-medium tracking-widest uppercase text-white/70">
              BonoStyle
            </span>
          </div>
        </div>

        <div className="relative z-10 -mt-8">
          <h1 className="text-4xl font-bold leading-tight tracking-tight mb-2">
            BONOSTYLE
            <br />
            CREATIONS LLP
          </h1>
          <p className="text-lg text-indigo-200/80 mb-10 font-light">
            Garment Manufacturing ERP
          </p>

          <div className="grid gap-5">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4 group">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-white/[0.07] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center transition-colors group-hover:bg-white/[0.12]">
                  <f.icon className="h-5 w-5 text-indigo-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/90">
                    {f.title}
                  </p>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <p className="text-xs text-white/30">
            Tirupur, Tamil Nadu, India
          </p>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] text-white/50">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            Powered by AI
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex flex-1 flex-col items-center justify-center relative bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 px-6 py-12">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_0.8px,transparent_0.8px)] [background-size:24px_24px] opacity-30" />

        <div className="lg:hidden relative z-10 text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              B
            </div>
            <span className="text-xs font-semibold tracking-widest uppercase text-indigo-600/70">
              BonoStyle
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            BONOSTYLE CREATIONS LLP
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Garment Manufacturing ERP
          </p>

          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {features.map((f) => (
              <span
                key={f.title}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-slate-200/80 text-xs text-slate-600 shadow-sm"
              >
                <f.icon className="h-3.5 w-3.5 text-indigo-500" />
                {f.title}
              </span>
            ))}
          </div>
        </div>

        <Card className="relative z-10 w-full max-w-[420px] shadow-xl shadow-slate-200/50 border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1.5 text-center pb-2 pt-8 px-8">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
              Welcome back
            </CardTitle>
            <CardDescription className="text-[13px] text-slate-500">
              Sign in to your ERP account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 pb-8 px-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {loginError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">
                  {loginError}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-[13px] text-slate-700">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    className="pl-10 h-11 bg-slate-50/80 border-slate-200 focus:bg-white transition-colors"
                    disabled={isLoading}
                    autoFocus
                    {...register("username", {
                      required: "Username is required",
                    })}
                  />
                </div>
                {errors.username && (
                  <p className="text-[12px] text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[13px] text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10 h-11 bg-slate-50/80 border-slate-200 focus:bg-white transition-colors"
                    disabled={isLoading}
                    {...register("password", {
                      required: "Password is required",
                    })}
                  />
                </div>
                {errors.password && (
                  <p className="text-[12px] text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full h-11 cursor-pointer font-medium mt-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 animate-pulse-glow"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 flex justify-center lg:hidden">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-600 font-medium">
                <Sparkles className="h-3 w-3" />
                Powered by AI
              </span>
            </div>
          </CardContent>
        </Card>

        <p className="relative z-10 mt-8 text-[11px] text-slate-400 text-center">
          &copy; {new Date().getFullYear()} BonoStyle Creations LLP. All rights reserved.
        </p>
      </div>

    </div>
  );
}
