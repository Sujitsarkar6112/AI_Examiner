import React, { useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useExtraction } from './ExtractionContext';
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/config";

const QuestionPaperSelector: React.FC = () => {
  const {
    questionPapers,
    selectedQuestionPaperId,
    setSelectedQuestionPaperId,
    fetchQuestionPapers
  } = useExtraction();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use API endpoint from config
      const response = await fetch(API_ENDPOINTS.QUESTION_PAPERS.UPLOAD, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload question paper');
      }

      toast.success('Question paper uploaded successfully');
      // Refresh the question papers list
      fetchQuestionPapers();
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading question paper:', error);
      toast.error('Failed to upload question paper');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Select Question Paper (Optional)
        </label>
        <Select
          value={selectedQuestionPaperId}
          onValueChange={(value) => setSelectedQuestionPaperId(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a question paper" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto" position="popper" side="bottom" align="start" sideOffset={4}>
            <SelectItem value="none">No question paper (general evaluation)</SelectItem>
            {questionPapers.map((paper) => (
              <SelectItem key={paper.id} value={paper.id}>
                {paper.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Selecting a question paper allows the system to map answers to questions for better evaluation.
        </p>
      </div>

      <div className="pt-2 border-t">
        <label className="text-sm font-medium block mb-2">
          Upload New Question Paper
        </label>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept=".pdf,.docx,.txt"
            className="hidden"
          />
          <Button 
            variant="outline" 
            size="sm"
            className="w-full flex items-center gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Upload Question Paper
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Supported formats: PDF, DOCX, TXT
        </p>
      </div>
    </div>
  );
};

export default QuestionPaperSelector;
