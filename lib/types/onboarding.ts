export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  path: string;
  component: string;
  order: number;
  required: boolean;
}

export interface OnboardingProgress {
  id: string;
  user_id: string;
  step_name: string;
  completed_at: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OnboardingData {
  company_name?: string;
  industry?: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  workers?: Array<{
    name: string;
    email: string;
    phone: string;
    position: string;
    hourly_rate: string;
    start_date: string;
  }>;
  worker_count?: string;
  pay_schedule?: string;
  time_tracking_method?: string;
}

export interface OnboardingState {
  isActive: boolean;
  currentStep: string | null;
  completedSteps: string[];
  data: OnboardingData;
  isLoading: boolean;
  error: string | null;
}

export type OnboardingAction =
  | { type: 'START_ONBOARDING' }
  | { type: 'COMPLETE_STEP'; step: string; data?: Record<string, unknown> }
  | { type: 'SET_CURRENT_STEP'; step: string }
  | { type: 'UPDATE_DATA'; data: Partial<OnboardingData> }
  | { type: 'LOAD_PROGRESS'; completedSteps: string[]; data: OnboardingData }
  | { type: 'RESET_ONBOARDING' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null };

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'company-setup',
    title: 'Company Setup',
    description: 'Enter your company information',
    path: '/dashboard',
    component: 'CompanySetupOverlay',
    order: 1,
    required: true,
  },
  {
    id: 'workers',
    title: 'Add Workers',
    description: 'Add your first worker to the team',
    path: '/dashboard/workers',
    component: 'WorkersStep',
    order: 2,
    required: true,
  },
  {
    id: 'clients',
    title: 'Add Clients',
    description: 'Add your first client',
    path: '/dashboard/clients',
    component: 'ClientsStep',
    order: 3,
    required: true,
  },
  {
    id: 'projects',
    title: 'Create Projects',
    description: 'Create your first project',
    path: '/dashboard/projects',
    component: 'ProjectsStep',
    order: 4,
    required: true,
  },
  {
    id: 'timesheets',
    title: 'Enter Timesheets',
    description: 'Learn how to enter worker time',
    path: '/dashboard/timesheets',
    component: 'TimesheetsStep',
    order: 5,
    required: true,
  },
  {
    id: 'approvals',
    title: 'Approve Time',
    description: 'Learn how to approve worker time',
    path: '/dashboard/approvals',
    component: 'ApprovalsStep',
    order: 6,
    required: true,
  },
  {
    id: 'payroll',
    title: 'Payroll Setup',
    description: 'Configure your payroll settings',
    path: '/dashboard/payroll',
    component: 'PayrollStep',
    order: 7,
    required: true,
  },
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description: 'See your complete dashboard',
    path: '/dashboard',
    component: 'DashboardStep',
    order: 8,
    required: true,
  },
];

export const getStepById = (id: string): OnboardingStep | undefined => {
  return ONBOARDING_STEPS.find(step => step.id === id);
};

export const getNextStep = (currentStepId: string): OnboardingStep | null => {
  const currentStep = getStepById(currentStepId);
  if (!currentStep) return null;
  
  const nextStep = ONBOARDING_STEPS.find(step => step.order === currentStep.order + 1);
  return nextStep || null;
};

export const getPreviousStep = (currentStepId: string): OnboardingStep | null => {
  const currentStep = getStepById(currentStepId);
  if (!currentStep) return null;
  
  const previousStep = ONBOARDING_STEPS.find(step => step.order === currentStep.order - 1);
  return previousStep || null;
}; 