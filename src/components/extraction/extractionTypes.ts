import { ProcessStep } from '@/components/ProcessFlowBar';
import { OCRHistory } from '@/services/ocr';
import { ProcessResult } from '@/services/evaluation';

export interface QuestionPaperItem {
  id: string;
  name: string;
  fileName?: string;
  totalMarks?: number;
  content?: string;
}

export interface ExtractionContextType {
  // State
  extractionHistory: OCRHistory[];
  selectedExtraction: OCRHistory | null;
  questionPapers: QuestionPaperItem[];
  selectedQuestionPaperId: string;
  isLoading: boolean;
  isEvaluating: boolean;
  isDeleting: boolean;
  deleteConfirmOpen: boolean;
  extractionToDelete: string | null;
  qaMapping: any[];
  isMappingLoading: boolean;
  processResult: ProcessResult | null;
  processSteps: ProcessStep[];
  currentStep: string | null;
  isAutomatedProcess: boolean;
  evaluationDialogOpen: boolean;
  
  // Actions
  setSelectedExtraction: (extraction: OCRHistory | null) => void;
  setSelectedQuestionPaperId: (id: string) => void;
  setDeleteConfirmOpen: (open: boolean) => void;
  setExtractionToDelete: (id: string | null) => void;
  setEvaluationDialogOpen: (open: boolean) => void;
  
  // Functions
  fetchExtractionHistory: () => Promise<void>;
  fetchQuestionPapers: () => Promise<void>;
  handleViewExtraction: (extraction: OCRHistory) => void;
  confirmDelete: (id: string) => void;
  handleDelete: () => Promise<void>;
  handleEvaluate: () => Promise<void>;
  startAutomatedEvaluation: () => Promise<void>;
  handleCancelAutomatedProcess: () => void;
}
