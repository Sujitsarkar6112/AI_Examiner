import React from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDashboard } from './DashboardContext';

const OcrStep: React.FC = () => {
  const { 
    extractedText, 
    isProcessing, 
    currentProcessingStep, 
    resetProcess, 
    handleMapping 
  } = useDashboard();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Extract Text (OCR)
        </CardTitle>
        <CardDescription>Extracting text from your document</CardDescription>
      </CardHeader>
      <CardContent>
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-center text-muted-foreground">{currentProcessingStep}</p>
          </div>
        ) : (
          <div>
            <p className="mb-4">OCR completed. Extracted text is shown below.</p>
            <ScrollArea className="h-[300px] w-full border rounded-md p-4 bg-gray-50 dark:bg-gray-900">
              <pre className="whitespace-pre-wrap font-mono text-sm">{extractedText}</pre>
            </ScrollArea>
            <div className="flex justify-end mt-4 space-x-2">
              <Button variant="outline" onClick={resetProcess}>Start Over</Button>
              <Button onClick={handleMapping}>Continue to Mapping</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OcrStep;
