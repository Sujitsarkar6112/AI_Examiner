import React from 'react';
import { PenTool, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useDashboard } from './DashboardContext';

const MappingStep: React.FC = () => {
  const {
    qaMapping,
    isProcessing,
    currentProcessingStep,
    selectedQuestionPaperId,
    handleMapping,
    handleEvaluate,
    setCurrentStep
  } = useDashboard();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Map Questions with Answers
          </CardTitle>
          <CardDescription>Matching extracted text with questions</CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-center text-muted-foreground">{currentProcessingStep}</p>
            </div>
          ) : (
            <div>
              {selectedQuestionPaperId === 'none' ? (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <div>
                    <AlertTitle>No question paper selected</AlertTitle>
                    <AlertDescription>General evaluation will be performed.</AlertDescription>
                  </div>
                </Alert>
              ) : qaMapping && qaMapping.length > 0 ? (
                <div>
                  <p className="mb-4">Mapped questions and answers:</p>
                  <ScrollArea className="h-[300px] w-full border rounded-md p-4 bg-gray-50 dark:bg-gray-900">
                    {qaMapping.map((item, index) => (
                      <div key={index} className="border-b p-4 mb-4 last:mb-0 last:border-0">
                        <div className="font-medium mb-2">Question {index + 1}:</div>
                        <p className="mb-3 whitespace-pre-wrap font-semibold bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          {item.question}
                          {item.max_marks && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">[{item.max_marks}]</span>
                          )}
                        </p>
                        <div className="font-medium mb-2">Answer:</div>
                        <p className="whitespace-pre-wrap">{item.answer}</p>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              ) : (
                <div>
                  <p className="mb-4">Ready to map questions and answers.</p>
                  <Alert variant="default" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <div>
                      <AlertTitle>Mapping Process Information</AlertTitle>
                      <AlertDescription>
                        Mapping will analyze your extracted text and match it with the questions from your selected question paper.
                        Click "Start Mapping" to begin this process.
                      </AlertDescription>
                    </div>
                  </Alert>
                </div>
              )}
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep('ocr')}>Back to OCR</Button>
                <div className="space-x-2">
                  {selectedQuestionPaperId !== 'none' && qaMapping.length === 0 && (
                    <Button onClick={handleMapping}>Start Mapping</Button>
                  )}
                  <Button onClick={handleEvaluate} disabled={qaMapping.length === 0}>Continue to Evaluation</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MappingStep;
