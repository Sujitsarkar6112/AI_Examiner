import React from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

export type ProcessStep = {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
};

interface ProcessFlowBarProps {
  steps: ProcessStep[];
  currentStepId: string | null | undefined;
}

const ProcessFlowBar: React.FC<ProcessFlowBarProps> = ({ steps, currentStepId }) => {
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div 
                className={`rounded-full h-10 w-10 flex items-center justify-center mb-2 transition-all ${
                  step.status === 'completed' 
                    ? 'bg-green-100 text-green-600' 
                    : step.status === 'in-progress'
                    ? 'bg-blue-100 text-blue-600 animate-pulse'
                    : step.status === 'error'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step.status === 'completed' && <CheckCircle className="h-6 w-6" />}
                {step.status === 'in-progress' && <Loader2 className="h-5 w-5 animate-spin" />}
                {step.status === 'pending' && <Circle className="h-5 w-5" />}
                {step.status === 'error' && (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <span 
                className={`text-sm font-medium ${
                  step.status === 'completed' 
                    ? 'text-green-600' 
                    : step.status === 'in-progress'
                    ? 'text-blue-600'
                    : step.status === 'error'
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            
            {/* Connector line between steps */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-gray-200 relative">
                <div 
                  className={`absolute inset-y-0 left-0 bg-green-500 transition-all ${
                    steps[index].status === 'completed' ? 'w-full' : 'w-0'
                  }`}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessFlowBar;
