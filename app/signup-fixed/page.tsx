"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
// import { useRouter } from "next/navigation";

export default function SignupFixedPage() {
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Add selected plan
      formData.append('plan', 'starter');

      console.log('Starting signup...');
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('Signup result:', result);

      if (response.ok) {
        toast.success("Account created!", {
          description: "Welcome to TropiTrack! Your starter trial starts now.",
        });
        
        // Store email for check-email page
        const email = formData.get('email') as string;
        if (email) {
          localStorage.setItem('signup-email', email);
        }
        
        console.log('Redirecting to check-email...');
        
        // Simple redirect after a delay
        setTimeout(() => {
          window.location.href = '/check-email';
        }, 2000);
        
      } else {
        toast.error("Signup failed", {
          description: result.error || "Please try again.",
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-[400px]">
        <Card className="w-full">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-2xl">Create Account (Fixed)</CardTitle>
            <CardDescription className="text-base">
              Test signup with fixed redirect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  placeholder="Create a password"
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_name">Company name</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  type="text"
                  placeholder="Your company name"
                  required
                />
              </div>
              
              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
