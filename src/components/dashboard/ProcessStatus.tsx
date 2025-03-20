import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboard } from './DashboardContext';

const ProcessStatus: React.FC = () => {
  const { processSteps, currentStep } = useDashboard();

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-5 w-5" />;
      case 'in-progress':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {processSteps.map((step, index) => (
          // Using a div instead of React.Fragment to avoid issues with additional props
          <div key={step.id} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2",
                  step.status === 'completed' && "border-green-500 text-green-500",
                  step.status === 'in-progress' && "border-blue-500 text-blue-500",
                  step.status === 'error' && "border-red-500 text-red-500",
                  step.status === 'pending' && currentStep === step.id && "border-blue-500 text-blue-500",
                  step.status === 'pending' && currentStep !== step.id && "border-gray-300 text-gray-300"
                )}
              >
                {getStepIcon(step.status) || index + 1}
              </div>
              <span 
                className={cn(
                  "text-xs mt-2 text-center",
                  step.status === 'completed' && "text-green-500",
                  step.status === 'in-progress' && "text-blue-500",
                  step.status === 'error' && "text-red-500",
                  step.status === 'pending' && currentStep === step.id && "text-blue-500 font-medium",
                  step.status === 'pending' && currentStep !== step.id && "text-gray-500"
                )}
              >
                {step.label}
              </span>
            </div>
            
            {/* Connector line between steps */}
            {index < processSteps.length - 1 && (
              <div 
                className={cn(
                  "flex-1 h-0.5 mx-2",
                  (processSteps[index].status === 'completed' && processSteps[index + 1].status === 'completed') && "bg-green-500",
                  (processSteps[index].status === 'completed' && processSteps[index + 1].status !== 'completed') && "bg-gray-300",
                  processSteps[index].status !== 'completed' && "bg-gray-300"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessStatus;
