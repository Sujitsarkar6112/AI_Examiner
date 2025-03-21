import { toast } from 'sonner';
import api from '../utils/api';
import { fetchData, postData, deleteData } from '../utils/api';
import { API_ENDPOINTS } from '../config';

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
export async function uploadQuestionPaperFile(file: File): Promise<QuestionPaper | null> {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);

    // Make the API request
    const response = await api.post(API_ENDPOINTS.QUESTION_PAPERS.PROCESS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Process and return the response
    return response.data;
  } catch (error: any) {
    console.error('Error uploading question paper:', error);
    
    // Try to extract a helpful error message
    const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
    toast.error(`Failed to upload question paper: ${errorMessage}`);
    
    return null;
  }
}

// Save question paper
export async function saveQuestionPaper(
  questionPaper: Partial<QuestionPaper>
): Promise<QuestionPaper | null> {
  try {
    // Save the question paper
    return await postData<QuestionPaper>(API_ENDPOINTS.QUESTION_PAPERS.GET(''), questionPaper);
  } catch (error: any) {
    console.error('Error saving question paper:', error);
    toast.error('Failed to save question paper');
    return null;
  }
}

// Get all saved question papers
export async function getQuestionPapers(): Promise<QuestionPaper[]> {
  try {
    return await fetchData<QuestionPaper[]>(API_ENDPOINTS.QUESTION_PAPERS.LIST);
  } catch (error: any) {
    console.error('Error fetching question papers:', error);
    toast.error('Failed to fetch question papers');
    return [];
  }
}

// Get a specific question paper by ID
export async function getQuestionPaper(id: string): Promise<QuestionPaper | null> {
  try {
    return await fetchData<QuestionPaper>(API_ENDPOINTS.QUESTION_PAPERS.GET(id));
  } catch (error: any) {
    console.error(`Error fetching question paper ${id}:`, error);
    toast.error('Failed to fetch question paper');
    return null;
  }
}

// Delete a question paper
export async function deleteQuestionPaper(id: string): Promise<boolean> {
  try {
    await deleteData(API_ENDPOINTS.QUESTION_PAPERS.DELETE(id));
    toast.success('Question paper deleted successfully');
    return true;
  } catch (error: any) {
    console.error(`Error deleting question paper ${id}:`, error);
    toast.error('Failed to delete question paper');
    return false;
  }
}

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
