"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Users, 
  ArrowRight, 
  Loader2, 
  CheckCircle, 
  Plus, 
  Upload, 
  UserPlus,
  FileText,
  SkipForward,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useOnboarding } from '@/context/onboarding-context';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { saveOnboardingData } from '@/lib/actions/onboarding-actions';
import { createWorker } from '@/lib/data/workers';
import { getAuthUserId } from '@/lib/data/userProfiles';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const workerSchema = z.object({
  name: z.string().min(1, 'Worker name is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone number is required'),
  position: z.string().min(1, 'Position is required'),
  hourly_rate: z.string().min(1, 'Hourly rate is required'),
  start_date: z.string().min(1, 'Start date is required'),
});

type WorkerFormData = z.infer<typeof workerSchema>;

interface WorkerData {
  name: string;
  email?: string;
  phone: string;
  position: string;
  hourly_rate: number;
  start_date: string;
}

const workerPositions = [
  "Project Manager",
  "Site Supervisor", 
  "Foreman",
  "Carpenter",
  "Electrician",
  "Plumber",
  "Mason",
  "Laborer",
  "Equipment Operator",
  "Safety Officer",
  "Quality Control",
  "Administrative Assistant",
  "Accountant",
  "Other",
];

export function WorkersStep() {
  const { completeStep } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [bulkText, setBulkText] = useState('');
  const [skipWorkers, setSkipWorkers] = useState(false);
  const router = useRouter();
  
  const form = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      position: '',
      hourly_rate: '',
      start_date: new Date().toISOString().split('T')[0],
    },
  });

  const addWorker = (data: WorkerFormData) => {
    const worker: WorkerData = {
      ...data,
      hourly_rate: parseFloat(data.hourly_rate),
      email: data.email || undefined,
    };
    setWorkers([...workers, worker]);
    form.reset();
    toast.success('Worker added to list');
  };

  const removeWorker = (index: number) => {
    setWorkers(workers.filter((_, i) => i !== index));
    toast.success('Worker removed from list');
  };

  const parseBulkWorkers = (text: string): WorkerData[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const parsed: WorkerData[] = [];
    
    for (const line of lines) {
      const parts = line.split(',').map(part => part.trim());
      if (parts.length >= 4) {
        const [name, position, hourly_rate, phone] = parts;
        const rate = parseFloat(hourly_rate);
        if (name && position && !isNaN(rate) && phone) {
          parsed.push({
            name,
            position,
            hourly_rate: rate,
            phone,
            start_date: new Date().toISOString().split('T')[0],
          });
        }
      }
    }
    
    return parsed;
  };

  const handleBulkImport = () => {
    const parsed = parseBulkWorkers(bulkText);
    if (parsed.length > 0) {
      setWorkers(parsed);
      setBulkText('');
      toast.success(`${parsed.length} workers imported successfully`);
    } else {
      toast.error('No valid workers found in the text. Please check the format.');
    }
  };

  const saveWorkers = async () => {
    if (workers.length === 0 && !skipWorkers) {
      toast.error('Please add at least one worker or skip this step');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get user ID
      const userId = await getAuthUserId();
      
      // Save workers to database
      const savedWorkers = [];
      for (const worker of workers) {
        const result = await createWorker(userId, {
          name: worker.name,
          email: worker.email,
          phone: worker.phone,
          position: worker.position,
          hourly_rate: worker.hourly_rate,
          hire_date: worker.start_date,
          is_active: true,
        });
        
        if (result.success && result.data) {
          savedWorkers.push(result.data);
        }
      }

      // Save onboarding data
      await saveOnboardingData(userId, { 
        workers: workers.map(w => ({
          name: w.name,
          email: w.email || '',
          phone: w.phone,
          position: w.position,
          hourly_rate: w.hourly_rate.toString(),
          start_date: w.start_date,
        })),
        worker_count: workers.length.toString()
      });
      
      // Complete this step and move to next
      completeStep('workers', { 
        workers: workers,
        worker_count: workers.length,
        skipped: skipWorkers 
      });
      
      toast.success(skipWorkers ? 'Step completed!' : `${workers.length} worker(s) added successfully!`);
      
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

  const handleSkip = () => {
    setSkipWorkers(true);
    saveWorkers();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Users className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">TropiTrack</span>
        </div>
        <p className="text-gray-500">Add your team members to get started</p>
        <Badge variant="secondary" className="mt-2">
          Step 2 of 8 - Add Workers
        </Badge>
      </div>

      {/* Progress Indicator */}
      <OnboardingProgress />

      {/* Main Content */}
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Add Your Team</CardTitle>
          <p className="text-gray-500">
            Add your workers to start tracking time and managing projects
          </p>
        </CardHeader>
        
        <CardContent className="p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add One by One
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Bulk Import
              </TabsTrigger>
              <TabsTrigger value="skip" className="flex items-center gap-2">
                <SkipForward className="h-4 w-4" />
                Skip for Now
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Add workers one by one with detailed information. You can add multiple workers before saving.
                </AlertDescription>
              </Alert>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(addWorker)} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
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
                          <FormLabel>Email Address</FormLabel>
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
                            <Input placeholder="+1 (242) 555-0123" {...field} />
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select position" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {workerPositions.map((position) => (
                                <SelectItem key={position} value={position}>
                                  {position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          <FormLabel>Hourly Rate ($) *</FormLabel>
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
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add to List
                    </Button>
                  </div>
                </form>
              </Form>

              {/* Workers List */}
              {workers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Workers to Add ({workers.length})</h3>
                  <div className="space-y-3">
                    {workers.map((worker, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{worker.name}</div>
                          <div className="text-sm text-gray-500">
                            {worker.position} • ${worker.hourly_rate}/hr
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeWorker(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="bulk" className="space-y-6">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Import multiple workers at once using CSV format: Name, Position, Hourly Rate, Phone
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Bulk Import</label>
                  <Textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="John Smith, Carpenter, 25.00, +1 (242) 555-0123&#10;Jane Doe, Electrician, 30.00, +1 (242) 555-0124&#10;Mike Johnson, Plumber, 28.00, +1 (242) 555-0125"
                    className="min-h-[200px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleBulkImport} className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Import Workers
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setBulkText('')}
                  >
                    Clear
                  </Button>
                </div>

                {workers.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Imported Workers ({workers.length})</h3>
                    <div className="space-y-3">
                      {workers.map((worker, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{worker.name}</div>
                            <div className="text-sm text-gray-500">
                              {worker.position} • ${worker.hourly_rate}/hr
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeWorker(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="skip" className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You can skip adding workers now and add them later from the Workers page. This will complete the onboarding step.
                </AlertDescription>
              </Alert>

              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  No problem! You can always add workers later from the Workers section of your dashboard.
                </p>
                <Button 
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      Skip for Now
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          {activeTab !== 'skip' && (
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-sm text-gray-500">
                {workers.length > 0 ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {workers.length} worker(s) ready to add
                  </span>
                ) : (
                  'Add at least one worker or skip this step'
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab('skip')}
                >
                  Skip for Now
                </Button>
                <Button 
                  onClick={saveWorkers}
                  disabled={isSubmitting || (workers.length === 0 && !skipWorkers)}
                  className="min-w-[200px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {skipWorkers ? 'Completing...' : 'Adding Workers...'}
                    </>
                  ) : (
                    <>
                      Continue to Clients
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress indicator */}
      <div className="text-center mt-6">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Workers will be added to your team automatically</span>
        </div>
      </div>
    </div>
  );
} 