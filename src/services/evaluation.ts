// This file is kept only for existing frontend components that rely on the types
// All processing now happens on the server side
import { toast } from 'sonner';
import { fetchData, postData, deleteData } from '../utils/api';
import { API_ENDPOINTS } from '../config';

// OCR result interface
export interface OCRResult {
  text: string;
  fileName: string;
  success?: boolean;
}

// Evaluation result interface
export interface EvaluationResult {
  id: string;
  fileName: string;
  timestamp: string;
  markdownContent: string;
  success?: boolean;
  questionPaperId?: string; // Optional field for question paper-based evaluations
}

// Interface for mapping results
export interface MappingResult {
  success: boolean;
  qa_mapping?: any[];
  error?: string;
}

// Process result interface
export interface ProcessResult {
  ocrResult?: OCRResult;
  mappingResult?: MappingResult;
  evaluationResult?: EvaluationResult;
  currentStep: string;
  error?: string;
}

export interface EvaluationRequest {
  text: string;
  fileName: string;
  questionPaperId?: string; // Optional question paper ID for targeted evaluation
}

export interface SaveEvaluationRequest {
  fileName: string;
  timestamp: string;
  markdownContent: string;
  questionPaperId?: string; // Optional question paper ID reference
}

// Evaluate answers using the backend - kept for backward compatibility
// This function now only passes through to the backend, actual processing happens server-side
export const evaluateAnswers = async (
  ocrResult: OCRResult, 
  fileName: string
): Promise<EvaluationResult> => {
  console.log('Delegating evaluation to server...');
  
  try {
    const result = await postData<EvaluationResult>(API_ENDPOINTS.EVALUATE, {
      text: ocrResult.text,
      fileName,
    });
    
    return result;
  } catch (error: any) {
    console.error('Error during evaluation:', error);
    toast.error('Evaluation failed: ' + (error.message || 'Network error. Please check your connection.'));
    throw error;
  }
};

// Function to get saved evaluations from the API
export const getSavedEvaluations = async (): Promise<EvaluationResult[]> => {
  try {
    return await fetchData<EvaluationResult[]>(API_ENDPOINTS.EVALUATIONS);
  } catch (error: any) {
    console.error('Failed to fetch evaluations:', error);
    toast.error('Failed to fetch evaluations. Please check your connection.');
    return [];
  }
};

// Function to save an evaluation via the API
export const saveEvaluation = async (
  evaluation: SaveEvaluationRequest
): Promise<EvaluationResult> => {
  try {
    // Convert to a generic object to satisfy RequestData type
    const data = {
      fileName: evaluation.fileName,
      timestamp: evaluation.timestamp,
      markdownContent: evaluation.markdownContent,
      ...(evaluation.questionPaperId ? { questionPaperId: evaluation.questionPaperId } : {})
    };
    
    const result = await postData<EvaluationResult>(API_ENDPOINTS.EVALUATION(), data);
    toast.success('Evaluation saved successfully');
    return result;
  } catch (error: any) {
    console.error('Error saving evaluation:', error);
    toast.error('Failed to save evaluation: ' + (error.message || 'Network error'));
    throw error;
  }
};

// Function to get a specific evaluation by ID
export const getEvaluationById = async (id: string): Promise<EvaluationResult | null> => {
  try {
    return await fetchData<EvaluationResult>(API_ENDPOINTS.EVALUATION(id));
  } catch (error: any) {
    console.error(`Error fetching evaluation with ID ${id}:`, error);
    toast.error('Failed to fetch evaluation. Please try again.');
    return null;
  }
};

// Delete evaluation via the API
export const deleteEvaluation = async (id: string): Promise<boolean> => {
  try {
    await deleteData(API_ENDPOINTS.EVALUATION(id));
    toast.success('Evaluation deleted successfully');
    return true;
  } catch (error: any) {
    console.error('Error deleting evaluation:', error);
    toast.error('Failed to delete evaluation. Please try again.');
    return false;
  }
};

// Delete all evaluations
export const deleteAllEvaluations = async (): Promise<boolean> => {
  try {
    await deleteData(API_ENDPOINTS.CLEAR_EVALUATIONS);
    toast.success('All evaluations deleted successfully');
    return true;
  } catch (error: any) {
    console.error('Error deleting all evaluations:', error);
    toast.error('Failed to delete all evaluations. Please try again.');
    return false;
  }
};

// Evaluate extracted text from OCR
export const evaluateExtractedText = async (
  extractedText: string,
  fileName: string,
  questionPaperId?: string
): Promise<EvaluationResult> => {
  console.log('Evaluating extracted text...');
  
  try {
    // Convert to a generic object to satisfy RequestData type
    const data = {
      text: extractedText,
      fileName,
      ...(questionPaperId && questionPaperId !== 'none' ? { questionPaperId } : {})
    };
    
    console.log('Sending evaluation request:', data);
    
    const result = await postData<EvaluationResult>(API_ENDPOINTS.EVALUATE, data);
    console.log('Received evaluation result:', result);
    return result;
  } catch (error) {
    console.error('Error evaluating extracted text:', error);
    toast.error('Failed to evaluate extracted text. Please try again.');
    throw new Error('Failed to evaluate extracted text');
  }
};

// Map questions with answers before evaluation
export const mapQuestionsWithAnswers = async (
  extractedText: string,
  questionPaperId: string
): Promise<any> => {
  try {
    console.log('Mapping questions with answers on server...');
    
    if (!questionPaperId) {
      throw new Error('Question paper ID is required for mapping');
    }
    
    const result = await postData(API_ENDPOINTS.MAP_QUESTIONS_ADVANCED, {
      extracted_text: extractedText,
      question_paper_id: questionPaperId
    });
    
    return result;
  } catch (error) {
    console.error('Error during question-answer mapping:', error);
    toast.error('Failed to map questions with answers. Please try again.');
    throw error;
  }
};

// Automated evaluation process that handles all steps in a sequence
export const automatedEvaluationProcess = async (
  file: File,
  questionPaperId?: string
): Promise<ProcessResult> => {
  // Define steps
  const steps = {
    OCR: 'ocr',
    MAPPING: 'mapping',
    EVALUATION: 'evaluation',
    COMPLETE: 'complete',
    ERROR: 'error'
  };
  
  let result: ProcessResult = {
    currentStep: steps.OCR
  };
  
  try {
    // Step 1: OCR Processing
    console.log('Step 1: OCR Processing');
    result.currentStep = steps.OCR;
    
    const formData = new FormData();
    formData.append('file', file);
    
    const ocrResponse = await fetch(API_ENDPOINTS.PROCESS_FILE, {
      method: 'POST',
      body: formData
    });
    
    if (!ocrResponse.ok) {
      throw new Error('OCR processing failed');
    }
    
    const ocrData = await ocrResponse.json();
    result.ocrResult = {
      text: ocrData.text,
      fileName: file.name,
      success: true
    };
    
    // If no question paper selected, skip mapping and go to evaluation
    if (!questionPaperId || questionPaperId === 'none') {
      // Step 3: Evaluation (Skip mapping)
      console.log('Skipping mapping and proceeding to evaluation');
      result.currentStep = steps.EVALUATION;
      
      const evaluationResult = await evaluateExtractedText(
        result.ocrResult.text,
        file.name
      );
      
      result.evaluationResult = evaluationResult;
      result.currentStep = steps.COMPLETE;
      return result;
    }
    
    // Step 2: Question-Answer Mapping
    console.log('Step 2: Question-Answer Mapping');
    result.currentStep = steps.MAPPING;
    
    const mappingResult = await mapQuestionsWithAnswers(
      result.ocrResult.text,
      questionPaperId
    );
    
    result.mappingResult = mappingResult;
    
    // Step 3: Evaluation
    console.log('Step 3: Evaluation');
    result.currentStep = steps.EVALUATION;
    
    const evaluationResult = await evaluateExtractedText(
      result.ocrResult.text,
      file.name,
      questionPaperId
    );
    
    result.evaluationResult = evaluationResult;
    result.currentStep = steps.COMPLETE;
    
    return result;
  } catch (error: any) {
    console.error('Error in automated evaluation process:', error);
    result.currentStep = steps.ERROR;
    result.error = error.message || 'Unknown error in evaluation process';
    toast.error(`Process failed at ${result.currentStep} step: ${result.error}`);
    return result;
  }
};
