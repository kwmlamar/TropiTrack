"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Building2, MapPin, FileText } from "lucide-react";
import { getCurrentUserCompany, updateCompany, type Company } from "@/lib/data/companies-client";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  tax_id: z.string().optional(),
  business_number: z.string().optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

const industries = [
  "Construction",
  "General Contracting",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Roofing",
  "Landscaping",
  "Interior Design",
  "Architecture",
  "Engineering",
  "Property Management",
  "Real Estate Development",
  "Other",
];

export function CompanyInformationForm() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    setLoading(true);
    try {
      const companyData = await getCurrentUserCompany();
      if (companyData) {
        setCompany(companyData);
        
        // Set form values with existing data
        const formData = {
          name: companyData.name || "",
          email: companyData.email || "",
          phone: companyData.phone || "",
          website: companyData.website || "",
          address: companyData.address || "",
          city: companyData.city || "",
          state: companyData.state || "",
          zip_code: companyData.zip_code || "",
          tax_id: companyData.tax_id || "",
          business_number: companyData.business_number || "",
          industry: companyData.industry || "",
          description: companyData.description || "",
        };
        
        // Reset form with existing data
        reset(formData);
      }
    } catch (error) {
      console.error("Error loading company:", error);
      toast.error("Failed to load company information");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    if (!company) return;

    setSaving(true);
    try {
      // Mark setup as completed when user saves company information
      const updatedCompany = await updateCompany(company.id, {
        ...data,
        setup_completed: true,
      });
      if (updatedCompany) {
        setCompany(updatedCompany);
        toast.success("Company information updated successfully");
        reset(data, { keepDirty: false });
      } else {
        toast.error("Failed to update company information");
      }
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company information");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading company information...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Update your company&apos;s basic details and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter company name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="company@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                {...register("website")}
                placeholder="https://www.example.com"
              />
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select onValueChange={(value) => setValue("industry", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Brief description of your company..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Information
          </CardTitle>
          <CardDescription>
            Your company&apos;s physical address and location details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register("city")}
                placeholder="City"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                {...register("state")}
                placeholder="State"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP/Postal Code</Label>
              <Input
                id="zip_code"
                {...register("zip_code")}
                placeholder="12345"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>
            Legal and business identification details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax ID / EIN</Label>
              <Input
                id="tax_id"
                {...register("tax_id")}
                placeholder="12-3456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_number">Business Number</Label>
              <Input
                id="business_number"
                {...register("business_number")}
                placeholder="Business registration number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saving || !isDirty}
          className="min-w-[120px]"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
} 