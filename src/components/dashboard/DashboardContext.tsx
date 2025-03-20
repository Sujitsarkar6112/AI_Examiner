import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { 
  getSavedEvaluations, 
  EvaluationResult, 
  mapQuestionsWithAnswers, 
  evaluateExtractedText,
  saveEvaluation,
} from '@/services/evaluation';
import { processFile } from '@/services/ocr';
import { getQuestionPapers, QuestionPaper } from '@/services/questionPaper';
import { 
  DashboardContextProps, 
  ProcessStep, 
  QuestionAnswer,
  DetailedEvaluationScore
} from './dashboardTypes';
import { extractDetailedScores, calculateTotalScore } from './evaluationUtils';

// Create context with default values
const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);

// Custom hook to use the dashboard context
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Current process state
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [qaMapping, setQaMapping] = useState<QuestionAnswer[]>([]);
  const [evaluationResult, setEvaluationResult] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingStep, setCurrentProcessingStep] = useState<string>('');
  
  // Track evaluation scores
  const [answerScores, setAnswerScores] = useState<DetailedEvaluationScore[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);
  
  // Question papers
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([]);
  const [selectedQuestionPaperId, setSelectedQuestionPaperId] = useState<string>('none');
  
  // Process flow tracking
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([
    { id: 'upload', label: 'Upload PDF', status: 'pending' },
    { id: 'ocr', label: 'Extract Text', status: 'pending' },
    { id: 'mapping', label: 'Map Questions', status: 'pending' },
    { id: 'evaluation', label: 'Evaluate Answers', status: 'pending' }
  ]);
  const [currentStep, setCurrentStep] = useState<string>('upload');

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);
  
  // Load saved evaluations and question papers
  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const results = await getSavedEvaluations();
      setEvaluations(results);
    } catch (error) {
      console.error("Error loading evaluations:", error);
      setError("Failed to load evaluations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluations();
    loadQuestionPapers();
  }, []);

  const loadQuestionPapers = async () => {
    try {
      const papers = await getQuestionPapers();
      setQuestionPapers(papers);
      if (papers.length > 0) {
        setSelectedQuestionPaperId(papers[0].id);
      }
    } catch (error) {
      console.error('Failed to load question papers:', error);
      toast.error('Failed to load question papers');
    }
  };

  const updateProcessStepStatus = (stepId: string, status: 'pending' | 'in-progress' | 'completed' | 'error') => {
    setProcessSteps(prevSteps => prevSteps.map(step => step.id === stepId ? { ...step, status } : step));
  };

  const resetProcess = () => {
    setFile(null);
    setExtractedText('');
    setQaMapping([]);
    setEvaluationResult('');
    setCurrentStep('upload');
    setProcessSteps(processSteps.map(step => ({ ...step, status: 'pending' })));
  };

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    updateProcessStepStatus('upload', 'completed');
    setCurrentStep('ocr');
    performOCR(uploadedFile);
  };

  const performOCR = async (fileToProcess: File) => {
    updateProcessStepStatus('ocr', 'in-progress');
    setIsProcessing(true);
    setCurrentProcessingStep('Extracting text from document...');
    try {
      const ocrResult = await processFile(fileToProcess);
      setExtractedText(ocrResult.text);
      updateProcessStepStatus('ocr', 'completed');
      setCurrentStep('mapping');
      toast.success('Text extracted successfully');
    } catch (error) {
      console.error('OCR processing error:', error);
      toast.error('Failed to extract text from document');
      updateProcessStepStatus('ocr', 'error');
    } finally {
      setIsProcessing(false);
      setCurrentProcessingStep('');
    }
  };

  const handleMapping = async () => {
    if (!extractedText) {
      toast.error("No text extracted to map");
      return;
    }

    setIsProcessing(true);
    setCurrentProcessingStep('Mapping questions and answers...');
    updateProcessStepStatus('mapping', 'in-progress');

    try {
      const mappedQA = await mapQuestionsWithAnswers(
        extractedText, 
        selectedQuestionPaperId
      );
      
      console.log("Mapped Q&A:", mappedQA); // Add logging to debug
      
      if (Array.isArray(mappedQA)) {
        // Make sure max_marks is properly set for display
        const processedMapping = mappedQA.map(item => ({
          ...item,
          question: item.question || item.questionText || "",
          max_marks: item.max_marks || item.maxMarks || 0
        }));
        setQaMapping(processedMapping);
      } else if (mappedQA && mappedQA.qa_mapping && Array.isArray(mappedQA.qa_mapping)) {
        // Handle the case where the backend returns { success: true, qa_mapping: [...] }
        const processedMapping = mappedQA.qa_mapping.map(item => ({
          ...item,
          question: item.question || item.questionText || "",
          max_marks: item.max_marks || item.maxMarks || 0
        }));
        setQaMapping(processedMapping);
      } else {
        // If we got a response but not in expected format
        console.error("Unexpected mapping response format:", mappedQA);
        toast.error("Received mapping data in unexpected format");
        setQaMapping([]);
      }
      
      toast.success("Mapping completed successfully");
      updateProcessStepStatus('mapping', 'completed');
      
      // After successful mapping, move to the evaluation tab to show results
      setCurrentStep('evaluation');
    } catch (error) {
      console.error("Error during mapping:", error);
      toast.error("Failed to map questions and answers");
      updateProcessStepStatus('mapping', 'error');
    } finally {
      setIsProcessing(false);
      setCurrentProcessingStep('');
    }
  };

  const handleEvaluate = async () => {
    if (!file || qaMapping.length === 0) {
      toast.error("Missing required data for evaluation. Please complete previous steps first.");
      return;
    }
    
    setIsProcessing(true);
    setCurrentProcessingStep('Evaluating answers...');
    updateProcessStepStatus('evaluation', 'in-progress');
    
    try {
      // Submit for evaluation
      const result = await evaluateExtractedText(
        extractedText,
        file.name,
        selectedQuestionPaperId,
        qaMapping
      );
      
      setEvaluationResult(result.markdownContent);
      
      // Extract detailed scores from markdown
      const detailedScores = extractDetailedScores(result.markdownContent);
      setAnswerScores(detailedScores);
      
      // Calculate total score
      const calculatedTotal = calculateTotalScore(detailedScores);
      setTotalScore(calculatedTotal);
      
      updateProcessStepStatus('evaluation', 'completed');
      toast.success("Evaluation completed successfully");
      
      // Save the evaluation for future reference
      await saveEvaluation({
        fileName: file.name,
        timestamp: new Date().toISOString(),
        markdownContent: result.markdownContent,
        questionPaperId: selectedQuestionPaperId !== 'none' ? selectedQuestionPaperId : undefined
      });
      
      // Refresh evaluations list
      loadEvaluations();
    } catch (error) {
      console.error("Error during evaluation: ", error);
      toast.error("Failed to evaluate answers. Please try again.");
      updateProcessStepStatus('evaluation', 'error');
    } finally {
      setIsProcessing(false);
      setCurrentProcessingStep('');
    }
  };

  const value: DashboardContextProps = {
    // States
    file,
    extractedText,
    qaMapping,
    evaluationResult,
    isProcessing,
    currentProcessingStep,
    answerScores,
    totalScore,
    questionPapers,
    selectedQuestionPaperId,
    processSteps,
    currentStep,
    evaluations,
    loading,
    error,
    
    // Actions
    setFile,
    setExtractedText,
    setQaMapping,
    setEvaluationResult,
    setIsProcessing,
    setCurrentProcessingStep,
    setAnswerScores,
    setTotalScore,
    setSelectedQuestionPaperId,
    setCurrentStep,
    
    // Functions
    handleFileUpload,
    performOCR,
    handleMapping,
    handleEvaluate,
    updateProcessStepStatus,
    resetProcess,
    loadEvaluations
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardContext;
