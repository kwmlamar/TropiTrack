"use client";

import { ReactNode } from "react";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface UsageLimitProps {
  feature: keyof import("@/lib/types/subscription").FeatureFlags;
  currentUsage: number;
  children: ReactNode;
  showWarning?: boolean;
  title?: string;
  unit?: string;
}

export function UsageLimit({ 
  feature, 
  currentUsage, 
  children, 
  showWarning = true,
  title,
  unit = ""
}: UsageLimitProps) {
  const { getLimit, canUseFeature } = useFeatureFlags();
  const limit = getLimit(feature);
  const isUnlimited = limit === -1;
  const usagePercentage = isUnlimited ? 0 : (currentUsage / limit) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isOverLimit = usagePercentage >= 100;

  if (!canUseFeature(feature)) {
    return (
      <Card className="border-dashed border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Lock className="h-5 w-5" />
            Feature Not Available
          </CardTitle>
          <CardDescription>
            This feature is not available with your current plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/settings/subscription">
              Upgrade Plan
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isOverLimit) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You have reached your limit for this feature. Please upgrade your plan to continue.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {children}
      
      {!isUnlimited && showWarning && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {title && <span className="text-sm font-medium">{title}</span>}
              <Badge variant={isNearLimit ? "destructive" : "secondary"}>
                {currentUsage}{unit} / {limit}{unit}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              {Math.round(usagePercentage)}% used
            </span>
          </div>
          
          <Progress 
            value={usagePercentage} 
            className={`h-2 ${isNearLimit ? "bg-destructive/20" : ""}`}
          />
          
          {isNearLimit && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You&apos;re approaching your limit. Consider upgrading your plan to avoid interruptions.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
} 