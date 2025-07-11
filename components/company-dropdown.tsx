"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentUserCompany, type Company } from "@/lib/data/companies-client";
import Link from "next/link";

interface CompanyDropdownProps {
  className?: string;
}

export function CompanyDropdown({ className }: CompanyDropdownProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const companyData = await getCurrentUserCompany();
      setCompany(companyData);
    } catch (error) {
      console.error("Error loading company:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" className={className} disabled>
        Loading...
      </Button>
    );
  }

  if (!company) {
    return (
      <Button variant="outline" size="sm" className={className}>
        No Company
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <span className="truncate max-w-[120px]">{company.name}</span>
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Current Company</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-default">
          <div className="flex flex-col items-start w-full">
            <span className="font-medium">{company.name}</span>
            {company.email && (
              <span className="text-xs text-muted-foreground">{company.email}</span>
            )}
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <Link href="/dashboard/settings?tab=general">
          <DropdownMenuItem>
            <Settings className="h-4 w-4 mr-2" />
            Company Settings
          </DropdownMenuItem>
        </Link>
        {/* Future: Add multiple companies support here */}
        {/* <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 