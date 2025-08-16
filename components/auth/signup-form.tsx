"use client";

import type React from "react";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { signup, signUpWithGoogle } from "@/app/actions/auth";
import { toast } from "sonner";
import { TropiTrackLogo } from "@/components/tropitrack-logo";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating account...
        </>
      ) : (
        "Create account"
      )}
    </Button>
  );
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const requirements = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    {
      label: "Contains uppercase letter",
      test: (p: string) => /[A-Z]/.test(p),
    },
    {
      label: "Contains lowercase letter",
      test: (p: string) => /[a-z]/.test(p),
    },
    { label: "Contains number", test: (p: string) => /\d/.test(p) },
  ];

  if (!password) return null;

  return (
    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
      <p className="text-xs font-medium text-gray-500">
        Password requirements:
      </p>
      <div className="space-y-1">
        {requirements.map((req, index) => {
          const isValid = req.test(password);
          return (
            <div key={index} className="flex items-center space-x-2 text-xs">
              {isValid ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <X className="h-3 w-3 text-gray-500" />
              )}
              <span
                className={isValid ? "text-green-600" : "text-gray-500"}
              >
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SignupForm({
  className,
  inviteToken,
  ...props
}: React.ComponentProps<"div"> & { inviteToken?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      setErrors({});
      
      // Add invite token to form data if provided
      if (inviteToken) {
        formData.append("invite_token", inviteToken);
      }
      
      const result = await signup(formData);

      if ('error' in result) {
        if (result.field) {
          setErrors({ [result.field]: result.error });
        } else {
          toast.error("Sign up failed", {
            description: result.error,
          });
        }
      } else {
        toast.success("Account created!", {
          description:
            "Welcome to TropiTrack. You can now start tracking time.",
        });
      }
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    }
  }

  async function handleGoogleSignUp() {
    try {
      setIsGoogleLoading(true);
      const result = await signUpWithGoogle();
      
      if ('error' in result) {
        toast.error("Google sign up failed", {
          description: result.error,
        });
      } else if ('url' in result) {
        // Redirect to Google OAuth
        window.location.href = result.url;
      }
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Header with Logo */}
      <div className="flex flex-col items-center space-y-4">
        <TropiTrackLogo size="lg" />
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-gray-500">
            Start tracking construction time in minutes
          </p>
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <form action={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  className={cn(
                    "pl-10 h-11",
                    errors.name &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                  required
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className={cn(
                    "pl-10 h-11",
                    errors.email &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Company Name Field */}
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-sm font-medium">
                Company name
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="company_name"
                  name="company_name"
                  type="text"
                  placeholder="Enter your company name"
                  className={cn(
                    "pl-10 h-11",
                    errors.company_name &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                  required
                />
              </div>
              {errors.company_name && (
                <p className="text-sm text-destructive">
                  {errors.company_name}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className={cn(
                    "pl-10 pr-10 h-11",
                    errors.password &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 h-4 w-4 text-gray-500 hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              <PasswordStrengthIndicator password={password} />
            </div>

            {/* Terms and Privacy */}
            <div className="text-xs text-gray-500">
              By creating an account, you agree to our{" "}
              <a
                href="/terms"
                className="text-orange-600 hover:text-orange-500 underline-offset-4 hover:underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="text-orange-600 hover:text-orange-500 underline-offset-4 hover:underline"
              >
                Privacy Policy
              </a>
              .
            </div>

            {/* Submit Buttons */}
            <div className="space-y-3 pt-2">
              <SubmitButton />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-11" 
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                {isGoogleLoading ? "Signing up..." : "Continue with Google"}
              </Button>
            </div>

            {/* Login link */}
            <div className="text-center text-sm text-gray-500 pt-4">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-medium text-orange-600 hover:text-orange-500 underline-offset-4 hover:underline"
              >
                Sign in
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
