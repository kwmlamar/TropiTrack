"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowUp, ArrowDown, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  onPlanChange: (newPlan: string) => void;
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$39',
    description: 'Perfect for small crews',
    features: [
      'Up to 15 workers',
      '5 active projects',
      'Time tracking & approvals',
      'Basic payroll reports',
      'Mobile app access',
      'Email support'
    ],
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$89',
    description: 'For growing companies',
    features: [
      'Up to 50 workers',
      'Unlimited projects',
      'Advanced payroll features',
      'Project cost tracking',
      'Document management',
      'Priority support'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$179',
    description: 'For large operations',
    features: [
      'Unlimited workers',
      'Multi-company access',
      'Advanced analytics',
      'Equipment tracking',
      'API access',
      'Dedicated support'
    ],
    popular: false
  }
];

export function PlanUpgradeModal({ isOpen, onClose, currentPlan, onPlanChange }: PlanUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [isLoading, setIsLoading] = useState(false);

  const currentPlanData = PLANS.find(p => p.id === currentPlan);
  const selectedPlanData = PLANS.find(p => p.id === selectedPlan);

  const isUpgrade = () => {
    const planOrder = ['starter', 'professional', 'enterprise'];
    const currentIndex = planOrder.indexOf(currentPlan);
    const selectedIndex = planOrder.indexOf(selectedPlan);
    return selectedIndex > currentIndex;
  };

  // Helper kept for messaging; referenced in UI text
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isDowngrade = () => {
    const planOrder = ['starter', 'professional', 'enterprise'];
    const currentIndex = planOrder.indexOf(currentPlan);
    const selectedIndex = planOrder.indexOf(selectedPlan);
    return selectedIndex < currentIndex;
  };

  const handlePlanChange = async () => {
    if (selectedPlan === currentPlan) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPlanId: selectedPlan,
        }),
      });

      if (response.ok) {
        toast.success('Plan updated successfully!', {
          description: `You've ${isUpgrade() ? 'upgraded' : 'downgraded'} to ${selectedPlanData?.name}`,
        });
        onPlanChange(selectedPlan);
        onClose();
      } else {
        const error = await response.json();
        toast.error('Failed to update plan', {
          description: error.error || 'Please try again',
        });
      }
        } catch {
      toast.error('Something went wrong', {
        description: 'Please try again later',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Change Your Plan
          </DialogTitle>
          <p className="text-gray-600">
            Choose a plan that works best for your business
          </p>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-3 mt-6">
          {PLANS.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedPlan === plan.id 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-gray-300'
              } ${plan.id === currentPlan ? 'bg-blue-50 border-blue-200' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              
              {plan.id === currentPlan && (
                <Badge className="absolute -top-2 right-2 bg-green-100 text-green-800">
                  Current Plan
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-gray-500 text-sm">{plan.description}</p>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPlan !== currentPlan && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {isUpgrade() ? (
                <ArrowUp className="h-4 w-4 text-blue-600" />
              ) : (
                <ArrowDown className="h-4 w-4 text-blue-600" />
              )}
              <span className="font-medium text-blue-800">
                {isUpgrade() ? 'Upgrade' : 'Downgrade'} Summary
              </span>
            </div>
            <p className="text-sm text-blue-700">
              You&apos;re {isUpgrade() ? 'upgrading' : 'downgrading'} from {currentPlanData?.name} to {selectedPlanData?.name}. 
              Changes will take effect immediately.
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-6 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          
          <Button 
            onClick={handlePlanChange}
            className="flex-1"
            disabled={isLoading || selectedPlan === currentPlan}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Updating...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                {selectedPlan === currentPlan ? 'No Changes' : `Switch to ${selectedPlanData?.name}`}
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center mt-4">
          You can change your plan anytime. Changes take effect immediately.
        </div>
      </DialogContent>
    </Dialog>
  );
}
