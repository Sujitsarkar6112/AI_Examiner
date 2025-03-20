import { EvaluationResult, QuestionPaper } from '@/services/evaluation';

export interface ParsedScore {
  total: number;
  theoretical: string;
  practical: string;
  holistic: string;
}

export interface DetailedEvaluationScore {
  questionIndex: number;
  score: number;
  feedback: string;
  perspectiveScores?: {
    theoretical: number;
    practical: number;
    holistic: number;
  };
}

export interface Question {
  text: string;
  max_marks: number;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  max_marks: number;
  [key: string]: any;
}

export interface ProcessStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

export interface DashboardContextProps {
  // States
  file: File | null;
  extractedText: string;
  qaMapping: QuestionAnswer[];
  evaluationResult: string;
  isProcessing: boolean;
  currentProcessingStep: string;
  answerScores: DetailedEvaluationScore[];
  totalScore: number;
  questionPapers: QuestionPaper[];
  selectedQuestionPaperId: string;
  processSteps: ProcessStep[];
  currentStep: string;
  evaluations: EvaluationResult[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setFile: (file: File | null) => void;
  setExtractedText: (text: string) => void;
  setQaMapping: (mapping: QuestionAnswer[]) => void;
  setEvaluationResult: (result: string) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setCurrentProcessingStep: (step: string) => void;
  setAnswerScores: (scores: DetailedEvaluationScore[]) => void;
  setTotalScore: (score: number) => void;
  setSelectedQuestionPaperId: (id: string) => void;
  setCurrentStep: (step: string) => void;
  
  // Functions
  handleFileUpload: (file: File) => void;
  performOCR: (file: File) => Promise<void>;
  handleMapping: () => Promise<void>;
  handleEvaluate: () => Promise<void>;
  updateProcessStepStatus: (stepId: string, status: 'pending' | 'in-progress' | 'completed' | 'error') => void;
  resetProcess: () => void;
  loadEvaluations: () => Promise<void>;
}
