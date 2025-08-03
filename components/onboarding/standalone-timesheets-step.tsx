"use client";


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { useOnboarding } from '@/context/onboarding-context';
import { toast } from 'sonner';

export function StandaloneTimesheetsStep() {
  const { completeStep } = useOnboarding();

  const handleContinue = async () => {
    try {
      // Mark step as completed and navigate to timesheets page
      await completeStep('timesheets');
      toast.success('Timesheets step completed!');
    } catch (error) {
      console.error('Error completing timesheets step:', error);
      toast.error('Failed to complete step. Please try again.');
    }
  };

  const handleSkip = async () => {
    try {
      // Mark step as completed and skip to next step
      await completeStep('timesheets');
      toast.success('Timesheets step skipped!');
    } catch (error) {
      console.error('Error skipping timesheets step:', error);
      toast.error('Failed to skip step. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] border-0 bg-white">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Enter Timesheets
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Navigate to the timesheets page to start tracking worker time
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Information */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Smart Completion Enabled</span>
            </div>
            <p className="text-gray-600">
              This step will automatically complete when you add timesheets on the timesheets page.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={handleContinue}
              className="flex items-center gap-2"
              size="lg"
            >
              Go to Timesheets Page
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleSkip}
              variant="outline"
              size="lg"
            >
              Skip for Now
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-500">
            <p>
              You can always access timesheets from the &quot;Time Tracking&quot; menu in the sidebar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 