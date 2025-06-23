"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share, X, Smartphone } from "lucide-react";

export function SafariInstallGuide() {
  const [showGuide, setShowGuide] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect Safari
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafariBrowser = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    setIsSafari(isSafariBrowser);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Show guide for Safari users after a delay
    if (isSafariBrowser && !isInstalled) {
      const timer = setTimeout(() => {
        setShowGuide(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isSafari, isInstalled]);

  const handleDismiss = () => {
    setShowGuide(false);
  };

  if (!showGuide || !isSafari || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Add to Home Screen</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Install TropiTrack for quick access and offline functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">How to install:</p>
            <ol className="space-y-1 ml-4">
              <li>1. Tap the <Share className="inline h-3 w-3" /> Share button</li>
              <li>2. Scroll down and tap &ldquo;Add to Home Screen&rdquo;</li>
              <li>3. Tap &ldquo;Add&rdquo; to install</li>
            </ol>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDismiss} className="flex-1">
              <Smartphone className="mr-2 h-4 w-4" />
              Got it
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 