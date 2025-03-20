import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboard } from './DashboardContext';

const EvaluationStep: React.FC = () => {
  const {
    isProcessing,
    currentProcessingStep,
    evaluationResult,
    answerScores,
    totalScore,
    qaMapping,
    handleEvaluate,
    resetProcess
  } = useDashboard();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Answer Evaluation</CardTitle>
          <CardDescription>
            Review the evaluation of the extracted answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">{currentProcessingStep}</p>
            </div>
          ) : evaluationResult ? (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg text-center mb-4">
                <h3 className="text-xl font-bold">Total Score: {totalScore} / {qaMapping.length * 10}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalScore >= qaMapping.length * 7 ? 'Excellent!' : 
                   totalScore >= qaMapping.length * 5 ? 'Good job!' : 'Needs improvement'}
                </p>
              </div>
              
              {answerScores.map((scoreItem, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold">Question {scoreItem.questionIndex + 1}</h4>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                      Score: {scoreItem.score}/10
                    </div>
                  </div>
                  <p className="font-bold mb-2">{qaMapping[scoreItem.questionIndex]?.question}</p>
                  <p className="mb-4 border-l-2 border-gray-200 pl-3">{qaMapping[scoreItem.questionIndex]?.answer}</p>
                  <div className="bg-muted p-3 rounded text-sm">
                    <h5 className="font-medium mb-1">Feedback:</h5>
                    <p className="whitespace-pre-wrap">{scoreItem.feedback}</p>
                  </div>
                  {scoreItem.perspectiveScores && (
                    <div className="bg-muted p-3 rounded text-sm mt-4">
                      <h5 className="font-medium mb-1">Scores by Perspective:</h5>
                      <p className="whitespace-pre-wrap">
                        <span className="font-bold">Theoretical:</span> {scoreItem.perspectiveScores.theoretical}<br />
                        <span className="font-bold">Practical:</span> {scoreItem.perspectiveScores.practical}<br />
                        <span className="font-bold">Holistic:</span> {scoreItem.perspectiveScores.holistic}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={resetProcess}
                >
                  Start New Evaluation
                </Button>
                <Button 
                  onClick={() => window.print()}
                >
                  Print Evaluation
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No evaluation results yet</p>
              <Button 
                onClick={handleEvaluate} 
                className="mt-4" 
                disabled={qaMapping.length === 0}
              >
                Start Evaluation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationStep;
