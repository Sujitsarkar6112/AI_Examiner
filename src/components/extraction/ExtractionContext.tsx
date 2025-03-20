import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { toast } from 'sonner';
import { getOCRHistory, deleteOCRHistory, OCRHistory } from '../../services/ocr';
import { evaluateExtractedText, saveEvaluation, mapQuestionsWithAnswers, 
  automatedEvaluationProcess, ProcessResult } from '../../services/evaluation';
import { getQuestionPapers } from '../../services/questionPaper';
import { ProcessStep } from '../ProcessFlowBar';
import { ExtractionContextType, QuestionPaperItem } from './extractionTypes';

// Create context
const ExtractionContext = createContext<ExtractionContextType | undefined>(undefined);

// Custom hook to use the extraction context
export const useExtraction = () => {
  const context = useContext(ExtractionContext);
  if (context === undefined) {
    throw new Error('useExtraction must be used within an ExtractionProvider');
  }
  return context;
};

interface ExtractionProviderProps {
  children: ReactNode;
  onEvaluationComplete?: () => Promise<void>;
}

export const ExtractionProvider: React.FC<ExtractionProviderProps> = ({ 
  children, 
  onEvaluationComplete 
}) => {
  // State variables
  const [extractionHistory, setExtractionHistory] = useState<OCRHistory[]>([]);
  const [selectedExtraction, setSelectedExtraction] = useState<OCRHistory | null>(null);
  const [questionPapers, setQuestionPapers] = useState<QuestionPaperItem[]>([]);
  const [selectedQuestionPaperId, setSelectedQuestionPaperId] = useState<string>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [extractionToDelete, setExtractionToDelete] = useState<string | null>(null);
  const [qaMapping, setQaMapping] = useState<any[]>([]);
  const [isMappingLoading, setIsMappingLoading] = useState(false);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
  
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([
    { id: 'upload', label: 'Upload Document', status: 'pending' },
    { id: 'ocr', label: 'Extract Text', status: 'pending' },
    { id: 'mapping', label: 'Map Questions', status: 'pending' },
    { id: 'evaluation', label: 'Evaluate Answers', status: 'pending' }
  ]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [isAutomatedProcess, setIsAutomatedProcess] = useState(false);

  // Update process steps when process result changes
  useEffect(() => {
    if (processResult) {
      const newSteps = [...processSteps];
      
      // Reset all steps to pending
      newSteps.forEach(step => step.status = 'pending');
      
      // Update upload step
      newSteps[0].status = 'completed';
      
      // Update steps based on current step
      switch (processResult.currentStep) {
        case 'ocr':
          newSteps[1].status = 'in-progress';
          break;
        case 'mapping':
          newSteps[1].status = 'completed';
          newSteps[2].status = 'in-progress';
          break;
        case 'evaluation':
          newSteps[1].status = 'completed';
          newSteps[2].status = 'completed';
          newSteps[3].status = 'in-progress';
          break;
        case 'complete':
          newSteps[1].status = 'completed';
          newSteps[2].status = 'completed';
          newSteps[3].status = 'completed';
          break;
        case 'error':
          // Find the in-progress step and mark it as error
          const errorStepIndex = newSteps.findIndex(step => step.status === 'in-progress');
          if (errorStepIndex >= 0) {
            newSteps[errorStepIndex].status = 'error';
          }
          break;
      }
      
      setProcessSteps(newSteps);
      setCurrentStep(processResult.currentStep);
    }
  }, [processResult]);

  // Load question papers on mount
  useEffect(() => {
    fetchExtractionHistory();
    fetchQuestionPapers();
  }, []);

  // Fetch question papers from API
  const fetchQuestionPapers = async () => {
    try {
      const papers = await getQuestionPapers();
      // Map to our interface
      const mappedPapers: QuestionPaperItem[] = papers.map((paper: any) => ({
        id: paper.id,
        name: paper.title || paper.fileName || 'Unnamed Paper',
        fileName: paper.fileName,
        totalMarks: paper.totalMarks,
        content: paper.content
      }));
      setQuestionPapers(mappedPapers);
    } catch (error) {
      console.error('Error fetching question papers:', error);
      toast.error('Failed to fetch question papers');
    }
  };

  // Fetch extraction history from API
  const fetchExtractionHistory = async () => {
    setIsLoading(true);
    try {
      const history = await getOCRHistory();
      setExtractionHistory(history);
    } catch (error) {
      console.error('Failed to fetch extraction history:', error);
      toast.error('Failed to load extraction history');
    } finally {
      setIsLoading(false);
    }
  };

  // Set selected extraction
  const handleViewExtraction = (extraction: OCRHistory) => {
    setSelectedExtraction(extraction);
  };

  // Confirm deletion of an extraction
  const confirmDelete = (id: string) => {
    setExtractionToDelete(id);
    setDeleteConfirmOpen(true);
  };

  // Delete an extraction
  const handleDelete = async () => {
    if (!extractionToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteOCRHistory(extractionToDelete);
      if (success) {
        // If the deleted item was selected, clear the selection
        if (selectedExtraction?.id === extractionToDelete) {
          setSelectedExtraction(null);
        }
        
        await fetchExtractionHistory();
        toast.success('Extraction deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting extraction:', error);
      toast.error('Failed to delete extraction');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setExtractionToDelete(null);
    }
  };

  // Evaluate extracted text
  const handleEvaluate = async () => {
    if (!selectedExtraction) {
      toast.error('No text selected for evaluation');
      return;
    }

    // First get the mapping if we haven't already
    if (selectedQuestionPaperId !== 'none' && (!qaMapping || qaMapping.length === 0)) {
      setIsMappingLoading(true);
      try {
        const mappingResult = await mapQuestionsWithAnswers(
          selectedExtraction.extractedText,
          selectedQuestionPaperId
        );
        
        if (mappingResult.success && mappingResult.qa_mapping) {
          setQaMapping(mappingResult.qa_mapping);
          toast.success('Questions and answers mapped successfully');
        } else {
          toast.error('Failed to map questions and answers');
          return; // Stop evaluation if mapping fails
        }
      } catch (error) {
        console.error('Mapping error:', error);
        toast.error('Failed to map questions and answers');
        return; // Stop evaluation if mapping fails
      } finally {
        setIsMappingLoading(false);
      }
    }

    setIsEvaluating(true);
    try {
      toast.info('Starting evaluation. This may take a few moments...');
      
      // Verify we have text to evaluate
      if (!selectedExtraction.extractedText || selectedExtraction.extractedText.trim() === '') {
        toast.error('The selected text is empty. Please select a valid extraction.');
        setIsEvaluating(false);
        return;
      }
      
      // Check if question paper is selected
      const questionPaperId = selectedQuestionPaperId === 'none' ? undefined : selectedQuestionPaperId;
      
      // Log the evaluation request
      console.log('Evaluation request:', {
        text: selectedExtraction.extractedText,
        fileName: selectedExtraction.fileName,
        questionPaperId: questionPaperId
      });
      
      // Perform the evaluation
      const result = await evaluateExtractedText(
        selectedExtraction.extractedText,
        selectedExtraction.fileName,
        questionPaperId
      );

      // Save the evaluation result
      await saveEvaluation({
        fileName: selectedExtraction.fileName,
        timestamp: new Date().toISOString(),
        markdownContent: result.markdownContent,
        questionPaperId: questionPaperId
      });

      // Show success message
      toast.success('Evaluation completed successfully!');
      
      // Open evaluation dialog to show results
      setEvaluationDialogOpen(true);
      
      // Refresh evaluations if callback provided
      if (onEvaluationComplete) {
        await onEvaluationComplete();
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      toast.error('Failed to evaluate text. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Start automated evaluation process
  const startAutomatedEvaluation = async () => {
    if (!selectedExtraction) {
      toast.error('No text selected for evaluation');
      return;
    }

    setIsAutomatedProcess(true);
    toast.info('Starting automated evaluation process...');

    try {
      setProcessResult({
        currentStep: 'ocr',
        ocrResult: {
          text: selectedExtraction.extractedText,
          fileName: selectedExtraction.fileName
        }
      });
      
      // Since we don't have a real async iterator in the backend service,
      // we'll simulate the process steps manually
      
      // Step 1: OCR (already done)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Mapping
      setProcessResult({
        currentStep: 'mapping',
        ocrResult: {
          text: selectedExtraction.extractedText,
          fileName: selectedExtraction.fileName
        }
      });
      
      // Do the mapping if we have a question paper selected
      let mappingData = null;
      if (selectedQuestionPaperId !== 'none') {
        try {
          const mappingResult = await mapQuestionsWithAnswers(
            selectedExtraction.extractedText,
            selectedQuestionPaperId
          );
          
          if (mappingResult.success && mappingResult.qa_mapping) {
            setQaMapping(mappingResult.qa_mapping);
            mappingData = mappingResult;
          } else {
            throw new Error('Mapping failed');
          }
        } catch (error) {
          setProcessResult({
            currentStep: 'error',
            error: 'Mapping failed: ' + (error instanceof Error ? error.message : String(error))
          });
          toast.error('Failed to map questions and answers');
          setIsAutomatedProcess(false);
          return;
        }
      }
      
      // Step 3: Evaluation
      setProcessResult({
        currentStep: 'evaluation',
        ocrResult: {
          text: selectedExtraction.extractedText,
          fileName: selectedExtraction.fileName
        },
        mappingResult: mappingData
      });
      
      // Perform the evaluation
      const questionPaperId = selectedQuestionPaperId === 'none' ? undefined : selectedQuestionPaperId;
      const evaluationResult = await evaluateExtractedText(
        selectedExtraction.extractedText,
        selectedExtraction.fileName,
        questionPaperId
      );
      
      // Step 4: Complete
      const finalResult: ProcessResult = {
        currentStep: 'complete',
        ocrResult: {
          text: selectedExtraction.extractedText,
          fileName: selectedExtraction.fileName
        },
        mappingResult: mappingData,
        evaluationResult: evaluationResult
      };
      
      setProcessResult(finalResult);
      
      // Save the evaluation
      await saveEvaluation({
        fileName: selectedExtraction.fileName,
        timestamp: new Date().toISOString(),
        markdownContent: evaluationResult.markdownContent,
        questionPaperId
      });
      
      // Refresh evaluations
      if (onEvaluationComplete) {
        await onEvaluationComplete();
      }
      
      // Show success message
      toast.success('Automated evaluation completed successfully!');
      
      // Open evaluation dialog if results available
      setEvaluationDialogOpen(true);
      
    } catch (error) {
      console.error('Automated process error:', error);
      setProcessResult({
        currentStep: 'error',
        error: 'Process failed: ' + (error instanceof Error ? error.message : String(error))
      });
      toast.error('Automated evaluation process failed. Please try again.');
    } finally {
      setIsAutomatedProcess(false);
    }
  };

  // Cancel automated process
  const handleCancelAutomatedProcess = () => {
    // In a real implementation, this would cancel any ongoing requests
    setIsAutomatedProcess(false);
    toast.info('Automated process cancelled');
  };

  // Context value
  const value: ExtractionContextType = {
    // State
    extractionHistory,
    selectedExtraction,
    questionPapers,
    selectedQuestionPaperId,
    isLoading,
    isEvaluating,
    isDeleting,
    deleteConfirmOpen,
    extractionToDelete,
    qaMapping,
    isMappingLoading,
    processResult,
    processSteps,
    currentStep,
    isAutomatedProcess,
    evaluationDialogOpen,
    
    // Actions
    setSelectedExtraction,
    setSelectedQuestionPaperId,
    setDeleteConfirmOpen,
    setExtractionToDelete,
    setEvaluationDialogOpen,
    
    // Functions
    fetchExtractionHistory,
    fetchQuestionPapers,
    handleViewExtraction,
    confirmDelete,
    handleDelete,
    handleEvaluate,
    startAutomatedEvaluation,
    handleCancelAutomatedProcess
  };

  return (
    <ExtractionContext.Provider value={value}>
      {children}
    </ExtractionContext.Provider>
  );
};

export default ExtractionContext;
