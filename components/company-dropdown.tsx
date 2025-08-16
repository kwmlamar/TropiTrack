"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getCurrentUserCompany, type Company } from "@/lib/data/companies-client";

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
      console.log("Loading company data...");
      const companyData = await getCurrentUserCompany();
      console.log("Company data loaded:", companyData);
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
    return null;
  }

  // Show the current company name as a button
  return (
    <Button variant="outline" size="sm" className={className}>
      {company.name}
    </Button>
  );
} 