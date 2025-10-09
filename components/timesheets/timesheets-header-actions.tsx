"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export function TimesheetsHeaderActions() {
  return (
    <Link href="/dashboard/timesheets/bulk">
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Create Timesheets
      </Button>
    </Link>
  );
}

