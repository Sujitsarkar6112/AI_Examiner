import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { parseManualInput } from '@/utils/markdownParser';

interface Question {
  id: string;
  question: string;
  marks: number;
}

interface QuestionPaper {
  id: string;
  title: string;
  totalMarks: number;
  fileName: string;
  uploadDate: string;
  questions: Question[];
}

interface CreateQuestionPaperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaperCreated: (paper: QuestionPaper) => void;
}

const CreateQuestionPaperDialog: React.FC<CreateQuestionPaperDialogProps> = ({
  open,
  onOpenChange,
  onPaperCreated
}) => {
  const [title, setTitle] = useState('');
  const [questionsText, setQuestionsText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleCreatePaper = () => {
    if (!title.trim()) {
      toast.error('Please enter a title for the question paper');
      return;
    }
    
    if (!questionsText.trim()) {
      toast.error('Please enter at least one question');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Parse the manually entered questions
      const parsedPaper = parseManualInput(questionsText);
      
      // Create a new question paper object
      const newPaper: QuestionPaper = {
        id: Date.now().toString(),
        title: title || parsedPaper.title,
        totalMarks: parsedPaper.totalMarks,
        fileName: `manual-${Date.now()}.md`,
        uploadDate: new Date().toISOString(),
        questions: parsedPaper.questions
      };
      
      if (newPaper.questions.length === 0) {
        toast.error('No valid questions could be parsed. Please check the format.');
        setIsProcessing(false);
        return;
      }
      
      // Save to localStorage
      const existingPapers = JSON.parse(localStorage.getItem('questionPapers') || '[]');
      const updatedPapers = [...existingPapers, newPaper];
      localStorage.setItem('questionPapers', JSON.stringify(updatedPapers));
      
      // Notify parent component
      onPaperCreated(newPaper);
      
      // Reset form and close dialog
      setTitle('');
      setQuestionsText('');
      onOpenChange(false);
      
      toast.success('Question paper created successfully');
    } catch (error) {
      console.error('Error creating question paper:', error);
      toast.error('Failed to create question paper');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Question Paper</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Question Paper Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
            />
          </div>
          
          <div>
            <label htmlFor="questions" className="block text-sm font-medium mb-1">
              Questions
            </label>
            <div className="mb-2">
              <p className="text-xs text-muted-foreground">
                Enter one question per line. Include marks in square brackets at the end of each question.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Example: "What is the capital of France? [5]"
              </p>
            </div>
            <Textarea
              id="questions"
              value={questionsText}
              onChange={(e) => setQuestionsText(e.target.value)}
              placeholder="Enter questions here..."
              className="min-h-[200px]"
            />
          </div>
          
          <div className="bg-muted p-3 rounded-md">
            <h3 className="text-sm font-medium mb-2">Format Guidelines</h3>
            <ul className="text-xs space-y-1 list-disc pl-5">
              <li>Each line will be treated as a separate question</li>
              <li>Add marks in square brackets at the end of each question: [5]</li>
              <li>You can include question numbers, but they'll be automatically added if missing</li>
              <li>The first line can be the title if it doesn't have marks or question number</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreatePaper}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                Processing...
              </>
            ) : (
              'Create Question Paper'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuestionPaperDialog;
