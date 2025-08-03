"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';

import { useOnboarding } from '@/context/onboarding-context';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { saveOnboardingData } from '@/lib/actions/onboarding-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const workerSchema = z.object({
  name: z.string().min(1, 'Worker name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  position: z.string().min(1, 'Position is required'),
  hourly_rate: z.string().min(1, 'Hourly rate is required'),
  start_date: z.string().min(1, 'Start date is required'),
});

type WorkerFormData = z.infer<typeof workerSchema>;

export function WorkersStep() {
  const { completeStep } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const form = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      position: '',
      hourly_rate: '',
      start_date: '',
    },
  });

  const onSubmit = async (data: WorkerFormData) => {
    setIsSubmitting(true);
    try {
      // Save onboarding data (will get real user ID from the function)
      await saveOnboardingData(undefined, { workers: [data] });
      
      // Complete this step and move to next
      completeStep('workers', data);
      
      toast.success('Worker added successfully!');
      
      // Navigate to clients page after a short delay
      setTimeout(() => {
        router.push('/dashboard/clients');
      }, 1000);
    } catch (error) {
      console.error('Error saving worker data:', error);
      toast.error('Failed to save worker information. Please try again.');
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
            <Users className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">TropiTrack</span>
          </div>
          <p className="text-gray-500">Add your first worker to the team</p>
          <Badge variant="secondary" className="mt-2">
            Step 2 of 8 - Add Workers
          </Badge>
        </div>

        {/* Progress Indicator */}
        <OnboardingProgress />

        {/* Form */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Add Your First Worker</CardTitle>
            <p className="text-gray-500">
              Enter the details of your first worker to get started
            </p>
          </CardHeader>
          
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John Smith" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="john@company.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Carpenter, Electrician, etc." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="hourly_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="25.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                        Adding Worker...
                      </>
                    ) : (
                      <>
                        Continue to Clients
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
            <span>Worker will be added to your team automatically</span>
          </div>
        </div>
      </div>
    </div>
  );
} 