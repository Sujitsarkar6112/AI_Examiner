import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ProcessFlowBar from '@/components/ProcessFlowBar';
import { useExtraction } from './ExtractionContext';

const ProcessStatus: React.FC = () => {
  const { 
    processSteps, 
    currentStep, 
    isAutomatedProcess,
    processResult
  } = useExtraction();

  if (!isAutomatedProcess) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            Automated Evaluation Process
            {processResult?.currentStep && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({processResult.currentStep})
              </span>
            )}
          </h3>
          
          <ProcessFlowBar 
            steps={processSteps} 
            currentStepId={processResult?.currentStep || undefined} 
          />

          {processResult?.error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              Error: {processResult.error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessStatus;
