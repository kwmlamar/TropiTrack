"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function TimesheetsHeaderActions() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleNavigate = () => {
    startTransition(() => {
      router.push('/dashboard/timesheets/bulk');
    });
  };

  const handleMouseEnter = () => {
    // Prefetch the route on hover for faster navigation
    router.prefetch('/dashboard/timesheets/bulk');
  };

  return (
    <Link 
      href="/dashboard/timesheets/bulk" 
      prefetch={true}
      onMouseEnter={handleMouseEnter}
    >
      <Button 
        size="sm" 
        disabled={isPending} 
        onClick={(e) => {
          e.preventDefault();
          handleNavigate();
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        {isPending ? "Loading..." : "Create Timesheets"}
      </Button>
    </Link>
  );
}

