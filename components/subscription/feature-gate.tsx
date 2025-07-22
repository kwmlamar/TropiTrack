"use client";

import { ReactNode } from "react";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, ArrowUp, Star } from "lucide-react";
import Link from "next/link";

interface FeatureGateProps {
  feature: keyof import("@/lib/types/subscription").FeatureFlags;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  upgradeMessage?: string;
  recommendedPlan?: string;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true,
  upgradeMessage = "This feature requires a higher subscription plan.",
  recommendedPlan
}: FeatureGateProps) {
  const { canUseFeature, loading } = useFeatureFlags();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!canUseFeature(feature)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
      return (
        <Card className="border-dashed border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Lock className="h-5 w-5" />
              Feature Not Available
            </CardTitle>
            <CardDescription>
              {upgradeMessage}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendedPlan && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Recommended:</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="default">{recommendedPlan}</Badge>
                    <Star className="h-3 w-3 text-yellow-500" />
                  </div>
                </div>
              )}
              <Button asChild className="w-full">
                <Link href="/dashboard/settings/subscription">
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  }

  return <>{children}</>;
} 