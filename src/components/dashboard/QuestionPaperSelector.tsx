import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboard } from './DashboardContext';

const QuestionPaperSelector: React.FC = () => {
  const { questionPapers, selectedQuestionPaperId, setSelectedQuestionPaperId } = useDashboard();
  
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">Select Question Paper</label>
      <Select
        value={selectedQuestionPaperId}
        onValueChange={setSelectedQuestionPaperId}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a question paper" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No question paper (general evaluation)</SelectItem>
          {questionPapers.map((paper) => (
            <SelectItem key={paper.id} value={paper.id}>
              {paper.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="mt-2 text-xs text-muted-foreground">
        {selectedQuestionPaperId === 'none' 
          ? 'General evaluation without structured questions.' 
          : 'Mapping answers to specific questions for detailed evaluation.'}
      </p>
    </div>
  );
};

export default QuestionPaperSelector;
