import { toast } from 'sonner';
import { fetchData, postData, deleteData, RequestData } from '../utils/api';
import api from '../utils/api';

export interface Question {
  id: string;
  text: string;
  marks: number;
  subQuestions?: Question[]; // Support for nested questions
}

export interface QuestionPaper {
  id: string;
  fileName: string;
  title?: string; // Optional title field
  timestamp: string;
  questions: Question[];
  totalMarks?: number; // Cached total marks
}

// Helper to extract error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

// Process a question paper file
export const processQuestionPaper = async (file: File): Promise<QuestionPaper> => {
  console.log('Processing question paper:', file.name);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // For form data, we need to use the axios instance directly
    const response = await api.post('/process-question-paper', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Get the server response
    const result = response.data;
    console.log('Server response:', result);
    
    // The server now handles all processing and returns a complete question paper
    return result;
  } catch (error) {
    console.error('Error processing question paper:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to process question paper');
    throw new Error('Unable to process');
  }
};

// Save question paper
export const saveQuestionPaper = async (fileName: string, questions: Question[]): Promise<QuestionPaper> => {
  const questionPaper = {
    fileName,
    timestamp: new Date().toISOString(),
    questions,
    totalMarks: questions.reduce((total, q) => total + q.marks, 0)
  };
  
  try {
    return await postData<QuestionPaper>('/question-paper', questionPaper);
  } catch (error) {
    console.error('Error saving question paper:', error);
    toast.error('Failed to save question paper: Server unavailable');
    throw error;
  }
};

// Get all saved question papers
export const getQuestionPapers = async (): Promise<QuestionPaper[]> => {
  try {
    return await fetchData<QuestionPaper[]>('/question-papers');
  } catch (error: unknown) {
    console.error('Error fetching question papers:', error);
    toast.error(`Failed to fetch question papers: ${getErrorMessage(error) || 'Server unavailable'}`);
    return [];
  }
};

// Get a specific question paper by ID
export const getQuestionPaper = async (paperId: string): Promise<QuestionPaper | null> => {
  try {
    return await fetchData<QuestionPaper>(`/question-paper/${paperId}`);
  } catch (error: unknown) {
    console.error(`Error fetching question paper with ID ${paperId}:`, error);
    toast.error('Failed to fetch question paper. Please try again.');
    return null;
  }
};

// Delete a question paper
export const deleteQuestionPaper = async (paperId: string): Promise<boolean> => {
  try {
    await deleteData(`/question-paper/${paperId}`);
    toast.success('Question paper deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting question paper:', error);
    toast.error('Failed to delete question paper: Server unavailable');
    return false;
  }
};

// Function to calculate the total marks for a question paper
export const calculateTotalMarks = (questionPaper: QuestionPaper): number => {
  if (!questionPaper.questions || !Array.isArray(questionPaper.questions)) {
    return 0;
  }
  
  return questionPaper.questions.reduce((total, question) => {
    // Add the marks for this question
    let sum = question.marks || 0;
    
    // If there are subquestions, add their marks too
    if (question.subQuestions && Array.isArray(question.subQuestions)) {
      sum += question.subQuestions.reduce((subTotal, subQ) => subTotal + (subQ.marks || 0), 0);
    }
    
    return total + sum;
  }, 0);
};
