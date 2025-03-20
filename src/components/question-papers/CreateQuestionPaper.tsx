import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';

interface Question {
  id: number;
  text: string;
  marks: number;
}

interface QuestionPaper {
  title: string;
  subject: string;
  date: string;
  totalMarks: number;
  questions: Question[];
}

interface QuestionPaperToSave {
  id: string;
  title: string;
  totalMarks: number;
  fileName: string;
  uploadDate: string;
  questions: {
    id: string;
    question: string;
    marks: number;
  }[];
}

const CreateQuestionPaper: React.FC = () => {
  const [questionPaper, setQuestionPaper] = useState<QuestionPaper>({
    title: '',
    subject: '',
    date: new Date().toISOString().split('T')[0],
    totalMarks: 0,
    questions: []
  });

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now(),
      text: '',
      marks: 0
    };
    setQuestionPaper(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const removeQuestion = (id: number) => {
    setQuestionPaper(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  const updateQuestion = (id: number, field: keyof Question, value: string | number) => {
    setQuestionPaper(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === id ? { ...q, [field]: value } : q
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Format the question paper according to the expected structure
      const paperToSave: QuestionPaperToSave = {
        id: Date.now().toString(), // This will be replaced by the server
        title: `${questionPaper.title} - ${questionPaper.subject}`,
        totalMarks: calculateTotalMarks(),
        fileName: `${questionPaper.title.toLowerCase().replace(/\s+/g, '-')}.md`,
        uploadDate: new Date().toISOString(),
        questions: questionPaper.questions.map((q, index) => ({
          id: `q-${index}`,
          question: q.text,
          marks: q.marks
        }))
      };

      // Try to save to API first
      try {
        const response = await api.post('/question-paper', paperToSave);
        if (response.data && response.data.id) {
          // Use the ID returned from the server
          paperToSave.id = response.data.id;
        }
      } catch (apiError) {
        console.warn('API save failed, falling back to localStorage:', apiError);
        // If API save fails, fall back to localStorage
      }

      // Save to localStorage as backup
      const existingPapers = JSON.parse(localStorage.getItem('questionPapers') || '[]');
      const updatedPapers = [...existingPapers, paperToSave];
      localStorage.setItem('questionPapers', JSON.stringify(updatedPapers));

      toast.success('Question paper saved successfully');

      // Reset form
      setQuestionPaper({
        title: '',
        subject: '',
        date: new Date().toISOString().split('T')[0],
        totalMarks: 0,
        questions: []
      });

      // Trigger a refresh of the question papers list
      window.dispatchEvent(new CustomEvent('questionPaperCreated', { 
        detail: { paper: paperToSave } 
      }));

    } catch (error) {
      console.error('Error saving question paper:', error);
      toast.error('Failed to save question paper');
    }
  };

  const calculateTotalMarks = () => {
    return questionPaper.questions.reduce((sum, q) => sum + q.marks, 0);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Create Question Paper</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Paper Title</Label>
              <Input
                id="title"
                value={questionPaper.title}
                onChange={(e) => setQuestionPaper(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter paper title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={questionPaper.subject}
                onChange={(e) => setQuestionPaper(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter subject name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={questionPaper.date}
                onChange={(e) => setQuestionPaper(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input
                id="totalMarks"
                type="number"
                value={calculateTotalMarks()}
                disabled
              />
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Questions</h3>
            <Button 
              type="button" 
              onClick={addQuestion}
              variant="outline"
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add Question
            </Button>
          </div>

          {questionPaper.questions.map((question, index) => (
            <Card key={question.id} className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-grow space-y-2">
                    <Label htmlFor={`question-${question.id}`}>
                      Question {index + 1}
                    </Label>
                    <Textarea
                      id={`question-${question.id}`}
                      value={question.text}
                      onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                      placeholder="Enter question text"
                      className="min-h-[100px]"
                      required
                    />
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-20">
                      <Label htmlFor={`marks-${question.id}`}>Marks</Label>
                      <Input
                        id={`marks-${question.id}`}
                        type="number"
                        min="0"
                        value={question.marks}
                        onChange={(e) => updateQuestion(question.id, 'marks', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeQuestion(question.id)}
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <Button type="submit" className="w-full md:w-auto">
            Save Question Paper
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuestionPaper; 