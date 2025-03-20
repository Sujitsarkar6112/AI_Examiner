import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useExtraction } from './ExtractionContext';

const EvaluationDialog: React.FC = () => {
  const { 
    evaluationDialogOpen,
    processResult,
    selectedExtraction,
    setEvaluationDialogOpen
  } = useExtraction();

  // Get markdown content from the process result
  const markdownContent = processResult?.evaluationResult?.markdownContent || '';
  const fileName = selectedExtraction?.fileName || 'evaluation';

  const handleDownload = () => {
    if (!markdownContent) return;
    
    // Create a blob with the markdown content
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.[^/.]+$/, '')}_evaluation.md`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <Dialog open={evaluationDialogOpen} onOpenChange={setEvaluationDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evaluation Results</DialogTitle>
        </DialogHeader>
        
        {markdownContent ? (
          <div className="prose dark:prose-invert max-w-none mt-4">
            <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm overflow-x-auto">
              {markdownContent}
            </pre>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No evaluation results available</p>
          </div>
        )}
        
        <DialogFooter className="mt-4">
          {markdownContent && (
            <Button 
              variant="outline" 
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Markdown
            </Button>
          )}
          <Button onClick={() => setEvaluationDialogOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluationDialog;
