"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, CreditCard, X } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (planId: string) => void;
  daysLeft: number;
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$39',
    description: 'Perfect for small crews',
    features: [
      'Up to 15 workers',
      'Up to 5 active projects at a time',
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

export function SubscriptionModal({ isOpen, onClose, onSubscribe, daysLeft }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState('professional');

  const handleSubscribe = () => {
    onSubscribe(selectedPlan);
  };

  const getUrgencyMessage = () => {
    if (daysLeft === 1) {
      return "Your trial ends tomorrow! Choose a plan to keep your workers clocking in.";
    } else if (daysLeft === 2) {
      return "Your trial ends in 2 days. Choose a plan to keep your workers clocking in.";
    } else {
      return `Your trial ends in ${daysLeft} days. Choose a plan to keep your workers clocking in.`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Choose Your Plan
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Clock className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800 font-medium">
              {getUrgencyMessage()}
            </p>
          </div>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-3 mt-6">
          {PLANS.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedPlan === plan.id 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
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
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <CheckCircle className="h-4 w-4" />
                    <span>14-day free trial included</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Maybe Later
          </Button>
          
          <Button 
            onClick={handleSubscribe}
            className="flex-1"
            disabled={!selectedPlan}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Start {PLANS.find(p => p.id === selectedPlan)?.name} Plan
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center mt-4">
          You can cancel anytime. No charges until your trial ends.
        </div>
      </DialogContent>
    </Dialog>
  );
}
