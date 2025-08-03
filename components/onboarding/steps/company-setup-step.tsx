"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from '@/context/onboarding-context';
import { saveOnboardingData } from '@/lib/actions/onboarding-actions';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { toast } from 'sonner';

const companySchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone number is required'),
  website: z.string().optional(),
  description: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export function CompanySetupStep() {
  const { completeStep } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      // Save onboarding data (will get real user ID from the function)
      await saveOnboardingData(undefined, data);
      
      // Complete this step and move to next
      completeStep('company-setup', data);
      
      toast.success('Company information saved!');
    } catch (error) {
      console.error('Error saving company data:', error);
      toast.error('Failed to save company information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">TropiTrack</span>
          </div>
          <p className="text-gray-500">Let&apos;s get your company set up</p>
          <Badge variant="secondary" className="mt-2">
            Step 1 of 8 - Company Setup
          </Badge>
        </div>

        {/* Progress Indicator */}
        <OnboardingProgress />

        {/* Form */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Company Information</CardTitle>
            <p className="text-gray-500">
              Tell us about your construction company
            </p>
          </CardHeader>
          
          <CardContent className="p-8">
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

        {/* Progress indicator */}
        <div className="text-center mt-6">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Company setup will be saved automatically</span>
          </div>
        </div>
      </div>
    </div>
  );
} 