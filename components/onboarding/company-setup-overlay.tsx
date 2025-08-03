"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { useOnboarding } from '@/context/onboarding-context';
import { saveOnboardingData } from '@/lib/actions/onboarding-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const companySchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone number is required'),
  website: z.string().optional(),
  description: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanySetupOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export function CompanySetupOverlay({ isVisible, onClose }: CompanySetupOverlayProps) {
  const { completeStep } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company_name: '',
      industry: '',
      address: '',
      phone: '',
      website: '',
      description: '',
    },
  });

  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    try {
      await saveOnboardingData(undefined, data);
      completeStep('company-setup', data);
      toast.success('Company information saved!');
      
      onClose();
      setTimeout(() => {
        router.push('/dashboard/workers');
      }, 500);
    } catch (error) {
      console.error('Error saving company data:', error);
      toast.error('Failed to save company information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-600 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(75, 85, 99, 0.5)' }}>
      <div className="w-full sm:max-w-[600px]">
        {/* Form */}
        <Card className="shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] border-0 bg-white">
          <CardHeader className="text-center relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute right-4 top-4 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-3xl font-bold">Company Information</CardTitle>
            <p className="text-gray-500">
              Tell us about your construction company
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ABC Construction Ltd." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Construction, Renovation, etc." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="123 Main Street, Nassau, Bahamas" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+1 (242) 555-0123" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://www.yourcompany.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your company, services, and specialties..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between pt-6">
                  <div className="text-sm text-gray-500">
                    * Required fields
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="min-w-[200px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Continue to Workers
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>


      </div>
    </div>
  );
} 