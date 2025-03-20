import React from 'react';
import { ExtractionProvider } from './ExtractionContext';
import ExtractionHistoryList from './ExtractionHistoryList';
import ExtractionViewer from './ExtractionViewer';
import QuestionPaperSelector from './QuestionPaperSelector';
import ProcessStatus from './ProcessStatus';
import EvaluationDialog from './EvaluationDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExtractionContainerProps {
  onEvaluationComplete?: () => Promise<void>;
}

const ExtractionContainer: React.FC<ExtractionContainerProps> = ({ 
  onEvaluationComplete 
}) => {
  return (
    <ExtractionProvider onEvaluationComplete={onEvaluationComplete}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Extraction History Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Extraction History</CardTitle>
            </CardHeader>
            <CardContent>
              <ExtractionHistoryList />
            </CardContent>
          </Card>
          
          {/* Question Paper Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Question Paper</CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionPaperSelector />
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Process Status */}
          <ProcessStatus />
          
          {/* Extraction Viewer */}
          <ExtractionViewer />
        </div>
      </div>

      {/* Evaluation Result Dialog */}
      <EvaluationDialog />
    </ExtractionProvider>
  );
};

export default ExtractionContainer;
