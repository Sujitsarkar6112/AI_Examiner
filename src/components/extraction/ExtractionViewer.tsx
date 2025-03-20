import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';
import { useExtraction } from './ExtractionContext';

const ExtractionViewer: React.FC = () => {
  const { 
    selectedExtraction,
    isEvaluating,
    isAutomatedProcess,
    handleEvaluate,
    startAutomatedEvaluation,
    handleCancelAutomatedProcess
  } = useExtraction();

  if (!selectedExtraction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Extracted Text</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Select an extraction from the list to view its content</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>
            {selectedExtraction.fileName}
            {selectedExtraction.pageCount && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({selectedExtraction.pageCount} pages)
              </span>
            )}
          </CardTitle>
          
          <div className="flex gap-2">
            {isAutomatedProcess ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelAutomatedProcess}
              >
                Cancel
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEvaluate}
                  disabled={isEvaluating}
                >
                  {isEvaluating ? 'Evaluating...' : 'Evaluate'}
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={startAutomatedEvaluation}
                  disabled={isEvaluating || isAutomatedProcess}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Auto Process
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[400px] mt-2">
          <div className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm">
            {selectedExtraction.extractedText}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ExtractionViewer;
