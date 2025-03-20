import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Check, FileUp, MapPin, Brain } from 'lucide-react';
import { toast } from 'sonner';
import UploadStep from './UploadStep';
import {
  ExtractStep,
  MapStep,
  EvaluateStep,
  API_BASE_URL,
  Question
} from './UploadEvaluateSteps';

// Define types for the components
interface QuestionPaper {
  id: string;
  title: string;
  totalMarks: number;
  questions: QuestionItem[];
}

interface QuestionItem {
  id: string;
  question: string;
  marks: number;
}

interface Mapping {
  question: string;
  answer: string;
  question_id?: string;
}

// Get question papers from localStorage
const getQuestionPaperById = (paperId: string): QuestionPaper | null => {
  if (paperId === 'default') return null;
  
  try {
    const papers = JSON.parse(localStorage.getItem('questionPapers') || '[]') as QuestionPaper[];
    return papers.find((p) => p.id === paperId) || null;
  } catch {
    return null;
  }
};

// Get the last selected question paper from localStorage or URL
const getInitialQuestionPaper = () => {
  const storedPaperId = localStorage.getItem('selectedQuestionPaperId');
  const hashParams = new URLSearchParams(window.location.hash.substring(window.location.hash.indexOf('?') + 1));
  const urlPaperId = hashParams.get('paperId');
  
  return urlPaperId || storedPaperId || 'default';
};

const steps = [
  { id: 'upload', icon: <FileUp className="h-5 w-5" />, title: 'Upload PDF' },
  { id: 'extract', icon: <FileText className="h-5 w-5" />, title: 'Extract Text' },
  { id: 'map', icon: <MapPin className="h-5 w-5" />, title: 'Map Questions' },
  { id: 'evaluate', icon: <Brain className="h-5 w-5" />, title: 'Evaluate Answers' },
];

// Get authentication token with improved error handling and token refresh
const getAuthToken = async (): Promise<string | null> => {
  try {
    // Check if we already have a token in localStorage
    const storedToken = localStorage.getItem('authToken');
    
    // If we have a token, validate it by checking for expiration
    if (storedToken) {
      try {
        // Simple validation - just check if it's a proper JWT format
        // A real validation would decode and check expiration
        const parts = storedToken.split('.');
        if (parts.length === 3) {
          return storedToken;
        }
        
        // If token doesn't look valid, remove it
        console.log('Stored token appears invalid, getting a new one');
        localStorage.removeItem('authToken');
      } catch (e) {
        console.warn('Error validating token, will get a new one', e);
        localStorage.removeItem('authToken');
      }
    }
    
    // Get a demo token with retry logic
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        console.log(`Attempting to get demo token (${retries} retries left)`);
        const response = await fetch(`${API_BASE_URL}/demo-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.token) {
          // Store the token for future use
          localStorage.setItem('authToken', data.token);
          console.log('Successfully obtained and stored new auth token');
          return data.token;
        } else {
          throw new Error('No token received from server');
        }
      } catch (error) {
        console.error(`Authentication attempt failed (${retries} retries left):`, error);
        lastError = error;
        retries--;
        
        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, (3 - retries) * 1000));
        }
      }
    }
    
    console.error('All authentication attempts failed:', lastError);
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};

// Fetch with improved error handling, timeout, and CORS handling
const enhancedFetch = async (url: string, options: RequestInit) => {
  try {
    // Get the auth token
    const token = await getAuthToken();
    
    // Add authorization header if token exists
    const headers = {
      ...options.headers,
      'Content-Type': options.body instanceof FormData ? undefined : 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    // Filter out undefined headers
    Object.keys(headers).forEach(key => 
      headers[key] === undefined && delete headers[key]
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200000); // 60-second timeout
    
    const fetchOptions = {
      ...options,
      headers,
      signal: controller.signal,
      mode: 'cors' as RequestMode,
      credentials: 'same-origin' as RequestCredentials
    };
    
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    
    // Log the response status for debugging
    if (!response.ok && response.status !== 401) {
      console.error(`API Error (${response.status}): ${url}`);
      
      // Try to get response text for better error reporting
      const errorText = await response.text().catch(() => 'No error details available');
      console.error('Error details:', errorText);
    }
    
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error(`Request timeout for ${url}`);
      throw new Error("Request timed out. Please try again.");
    }
    
    // For network errors, provide a clearer message
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error(`Network error for ${url}. Server may be unreachable.`);
      throw new Error("Cannot connect to the server. Please check your connection and ensure the server is running.");
    }
    
    // Rethrow with additional context
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
};

interface EvaluationPayload {
  text_id: string;
  text?: string;
  question_answers?: Array<Mapping>;
  question_paper?: {
    title: string;
    total_marks: number;
    questions: Array<{
      question: string;
      marks: number;
    }>;
  };
}

const UploadEvaluateContainer: React.FC = () => {
  const [selectedQuestionPaper, setSelectedQuestionPaper] = useState(getInitialQuestionPaper());
  const [questionPaperData, setQuestionPaperData] = useState<QuestionPaper | null>(null);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState('upload');
  const [extractedText, setExtractedText] = useState('');
  const [mappedQuestions, setMappedQuestions] = useState<Array<Question>>([]);
  const [evaluationResult, setEvaluationResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [extractedTextId, setExtractedTextId] = useState('');
  const [totalScore, setTotalScore] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Initialize authentication and question paper data
  useEffect(() => {
    const checkServerAvailability = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, { 
          method: 'GET',
          mode: 'cors',
          cache: 'no-store'
        });
        
        if (response.ok) {
          console.log('Backend server is available');
        } else {
          console.warn(`Backend server returned status ${response.status}`);
          toast.warning('Server may not be fully operational');
        }
      } catch (error) {
        console.error('Backend server is not available:', error);
        setErrorMessage('Cannot connect to the server. Please ensure the server is running.');
        toast.error('Server connection failed');
      }
    };

    const initAuth = async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          setIsAuthenticated(true);
        } else {
          setErrorMessage('Failed to authenticate. Some features may not work properly.');
          toast.error('Authentication failed');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setErrorMessage('Failed to authenticate. Some features may not work properly.');
        toast.error('Authentication failed');
      }
    };
    
    // Check server availability first, then authenticate
    checkServerAvailability().then(() => {
      initAuth();
    });
    
    // Load question paper data
    const paperId = selectedQuestionPaper;
    if (paperId && paperId !== 'default') {
      const paper = getQuestionPaperById(paperId);
      setQuestionPaperData(paper);
    } else {
      setQuestionPaperData(null);
    }
    
    localStorage.setItem('selectedQuestionPaperId', paperId);
  }, []);

  // Listen for question paper selection events
  useEffect(() => {
    const handleQuestionPaperSelected = (event: CustomEvent) => {
      const paperId = event.detail.paperId;
      setSelectedQuestionPaper(paperId);
      
      const paper = getQuestionPaperById(paperId);
      setQuestionPaperData(paper);
      
      localStorage.setItem('selectedQuestionPaperId', paperId);
    };

    window.addEventListener('questionPaperSelected', handleQuestionPaperSelected as EventListener);

    return () => {
      window.removeEventListener('questionPaperSelected', handleQuestionPaperSelected as EventListener);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setProcessingError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await enhancedFetch(`${API_BASE_URL}/process-file`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const text = await response.text();
        const data = JSON.parse(text);
        
        if (data.extractedText || data.text) {
          const extractedTextContent = data.extractedText || data.text;
          const id = data.text_id || data.id || `local_${new Date().getTime()}`;
          
          // Save the extracted text
          const extractedText = {
            id: id,
            text: extractedTextContent,
            fileName: file.name,
            uploadDate: new Date().toISOString()
          };

          // Try to save to API first
          try {
            await enhancedFetch(`${API_BASE_URL}/extracted-text`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(extractedText),
            });
          } catch (apiError) {
            console.warn('API save failed, falling back to localStorage:', apiError);
          }

          // Save to localStorage as backup
          const existingTexts = JSON.parse(localStorage.getItem('extractedTexts') || '[]');
          const updatedTexts = [...existingTexts, extractedText];
          localStorage.setItem('extractedTexts', JSON.stringify(updatedTexts));

          // Update state with extracted text
          setExtractedText(extractedTextContent);
          setExtractedTextId(id);
          setCurrentStep('extract');
          toast.success('Text extracted successfully');
        } else {
          throw new Error('No text extracted from the file');
        }
      } else {
        const errorText = await response.text().catch(() => 'Failed to get error details');
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setProcessingError(error instanceof Error ? error.message : 'Failed to process file');
      toast.error('Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGetMappings = async () => {
    if (!questionPaperData || !extractedTextId) {
      toast.error("Missing question paper or extracted text");
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      const questions = questionPaperData.questions.map((q: QuestionItem) => ({
        question: q.question,
        marks: q.marks
      }));
      
      const response = await enhancedFetch(`${API_BASE_URL}/map-questions-answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text_id: extractedTextId,
          questions: questions
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to get error details');
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to map questions to answers');
      }

      if (!data.mappings || data.mappings.length === 0) {
        toast.warning("No answers could be mapped to questions. Please check the document.");
        setErrorMessage("No answers could be mapped to questions. Please check if the answer document contains answers to the questions in the paper.");
        setIsProcessing(false);
        return;
      }

      const validMappings = data.mappings.filter((m: Mapping) => m.answer && m.answer.trim() !== '');
      
      if (validMappings.length === 0) {
        toast.warning("No valid answers found in the document");
        setErrorMessage("No valid answers could be found in the document. Please check if the document contains answers to the questions.");
        setIsProcessing(false);
        return;
      }
      
      setMappedQuestions(data.mappings);
      
      const totalQuestions = questionPaperData.questions.length;
      const answeredQuestions = validMappings.length;
      
      toast.success(`Successfully mapped ${answeredQuestions} of ${totalQuestions} questions`);
      
      if (answeredQuestions < totalQuestions) {
        toast.info(`${totalQuestions - answeredQuestions} questions have no answers`);
      }
      
      setCurrentStep('map');
      
    } catch (error) {
      console.error('Error getting mappings:', error);
      setErrorMessage(`Failed to map questions to answers: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error(`Mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMap = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      const payload: EvaluationPayload = {
        text_id: extractedTextId
      };
      
      if (selectedQuestionPaper !== 'default' && questionPaperData) {
        payload.question_answers = mappedQuestions;
        payload.question_paper = {
          title: questionPaperData.title,
          total_marks: questionPaperData.totalMarks,
          questions: questionPaperData.questions.map((q: QuestionItem) => ({
            question: q.question,
            marks: q.marks
          }))
        };
      } else {
        payload.text = extractedText;
      }
      
      const response = await enhancedFetch(`${API_BASE_URL}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to get error details');
        throw new Error(`Server responded with ${response.status}`);
      }

      let data;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error('Failed to parse server response');
      }
      
      setEvaluationResult(data.evaluation);
      setTotalScore(data.score || 'N/A');
      setCurrentStep('evaluate');
      toast.success("Evaluation completed");
    } catch (error) {
      console.error('Error evaluating answers:', error);
      setErrorMessage('Failed to evaluate answers. Please try again or contact support.');
      toast.error("Failed to evaluate answers");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!fileUpload || !evaluationResult) {
      toast.error("Nothing to save");
      return;
    }
    
    try {
      const payload = {
        id: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        filename: fileUpload.name,
        evaluation: evaluationResult,
        score: totalScore,
        total_score: selectedQuestionPaper && questionPaperData ? questionPaperData.totalMarks || 100 : 100,
        question_paper_id: selectedQuestionPaper,
        timestamp: new Date().toISOString()
      };
      
      const response = await enhancedFetch(`${API_BASE_URL}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      toast.success("Saved to history");
      
      // Reset for a new evaluation
      setTimeout(() => {
        setCurrentStep('upload');
        setFileUpload(null);
        setExtractedText('');
        setMappedQuestions([]);
        setEvaluationResult('');
        setErrorMessage('');
        setExtractedTextId('');
        setTotalScore('');
      }, 1000);
    } catch (error) {
      console.error('Error saving to history:', error);
      toast.error("Failed to save to history");
    }
  };

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <UploadStep 
            fileUpload={fileUpload}
            handleFileChange={handleFileChange}
            handleUpload={handleFileUpload}
            isProcessing={isProcessing}
            selectedQuestionPaper={selectedQuestionPaper}
            questionPaperData={questionPaperData}
            processingError={processingError}
          />
        );
      case 'extract':
        return (
          <ExtractStep
            extractedText={extractedText}
            handleGetMappings={handleGetMappings}
            isProcessing={isProcessing}
            selectedQuestionPaper={selectedQuestionPaper}
            errorMessage={errorMessage}
          />
        );
      case 'map':
        return (
          <MapStep
            mappedQuestions={mappedQuestions}
            handleMap={handleMap}
            isProcessing={isProcessing}
            errorMessage={errorMessage}
          />
        );
      case 'evaluate':
        return (
          <EvaluateStep
            evaluationResult={evaluationResult}
            totalScore={totalScore}
            fileUpload={fileUpload}
            handleSaveToHistory={handleSaveToHistory}
            setCurrentStep={setCurrentStep}
            errorMessage={errorMessage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Evaluate Answers</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>Upload PDF to evaluate answers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {steps.map((step, index) => {
                  const currentIndex = getCurrentStepIndex();
                  let status = '';
                  
                  if (index < currentIndex) status = 'complete';
                  else if (index === currentIndex) status = 'current';
                  else status = 'upcoming';
                  
                  return (
                    <div 
                      key={step.id}
                      className={`flex items-center space-x-3 p-3 rounded-md ${
                        status === 'current' ? 'bg-primary/10 border border-primary/30' :
                        status === 'complete' ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        status === 'complete' ? 'bg-primary text-white' :
                        status === 'current' ? 'border-2 border-primary text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {status === 'complete' ? <Check className="h-4 w-4" /> : step.icon}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${
                          status === 'upcoming' ? 'text-muted-foreground' : ''
                        }`}>
                          {step.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {steps.find(step => step.id === currentStep)?.title || 'Upload PDF'}
              </CardTitle>
              <CardDescription>
                {currentStep === 'upload' && 'Upload a PDF file to extract and evaluate answers.'}
                {currentStep === 'extract' && 'Review the extracted text from the PDF.'}
                {currentStep === 'map' && 'Review the mapped questions and answers.'}
                {currentStep === 'evaluate' && 'Review the evaluation results.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderCurrentStep()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UploadEvaluateContainer;
