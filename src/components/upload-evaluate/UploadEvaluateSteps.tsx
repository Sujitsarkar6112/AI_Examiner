import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Upload, ChevronRight, Brain, FileQuestion, Loader2 } from 'lucide-react';

export interface Question {
  question: string;
  answer: string;
}

// Define API base URL
export const API_BASE_URL = 'http://localhost:3000/api';

interface QuestionPaper {
  id: string;
  title: string;
  totalMarks: number;
  questions: Array<{
    id: string;
    question: string;
    marks: number;
  }>;
}

interface UploadStepProps {
  fileUpload: File | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpload: (file: File) => void;
  isProcessing: boolean;
  selectedQuestionPaper: string;
  questionPaperData: QuestionPaper | null;
  errorMessage?: string;
}

export const UploadStep: React.FC<UploadStepProps> = ({
  fileUpload,
  handleFileChange,
  handleUpload,
  isProcessing,
  selectedQuestionPaper,
  questionPaperData,
  errorMessage
}) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Check if the error contains specific keywords
  const isTimeoutError = errorMessage?.toLowerCase().includes('timeout');
  const isFileSizeError = errorMessage?.toLowerCase().includes('large') || 
                         errorMessage?.toLowerCase().includes('size');
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const onButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Upload Document</h3>
        <p className="text-sm text-muted-foreground">
          Upload a document containing student answers. Supported formats: PDF, Images (JPG, PNG), Word Documents, and Text Files.
        </p>
        
        {/* File size recommendations */}
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
          <p className="font-medium">Recommendations for best results:</p>
          <ul className="list-disc ml-5 mt-1 space-y-1">
            <li>Keep files under 10MB for faster processing</li>
            <li>Text-based PDFs work better than scanned images</li>
            <li>For long documents, consider splitting into smaller files</li>
          </ul>
        </div>
        
        {/* Error message with enhanced guidance */}
        {errorMessage && (
          <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md text-sm">
            <p className="font-medium text-destructive mb-1">Error:</p>
            <p>{errorMessage}</p>
            
            {(isTimeoutError || isFileSizeError) && (
              <div className="mt-3">
                <p className="font-medium">Troubleshooting steps:</p>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>Try uploading a smaller document (under 10 pages)</li>
                  <li>Convert image-heavy PDFs to plain text when possible</li>
                  <li>Split your document into multiple smaller files</li>
                  <li>If using scanned documents, ensure they are clear and high-quality</li>
                  <li>For very large papers, consider processing sections separately</li>
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Selected Question Paper Details */}
        {selectedQuestionPaper !== 'default' && questionPaperData && (
          <div className="p-4 border rounded-md bg-muted">
            <h4 className="font-medium mb-2">Selected Question Paper:</h4>
            <p className="text-sm">{questionPaperData.title}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {questionPaperData.questions.length} questions | {questionPaperData.totalMarks} marks
            </p>
          </div>
        )}

        {/* File Upload Area */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <div className="border rounded-md p-4 h-40 flex flex-col items-center justify-center">
              {fileUpload ? (
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">{fileUpload.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(fileUpload.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop your file here or click to browse
                  </p>
                </div>
              )}
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
          </div>
          
          {/* Upload Button */}
          <div className="flex flex-col justify-end">
            <Button
              className="w-full" 
              onClick={() => fileUpload && handleUpload(fileUpload)}
              disabled={!fileUpload || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Process
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ExtractStepProps {
  extractedText: string;
  handleGetMappings: () => Promise<void>;
  isProcessing: boolean;
  selectedQuestionPaper: string;
  errorMessage?: string;
}

export const ExtractStep: React.FC<ExtractStepProps> = ({
  extractedText,
  handleGetMappings,
  isProcessing,
  selectedQuestionPaper,
  errorMessage
}) => {
  // Check if the error is specifically a timeout
  const isTimeoutError = errorMessage?.toLowerCase().includes('timeout');

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Extracted Text</h3>
        
        {/* Show error message if present */}
        {errorMessage && (
          <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md text-sm">
            <p className="font-medium text-destructive mb-1">Error:</p>
            <p>{errorMessage}</p>
            {isTimeoutError && (
              <div className="mt-2 text-muted-foreground">
                <p className="font-medium">Suggestions:</p>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>Try again with a simpler or shorter document</li>
                  <li>Split your document into smaller sections</li>
                  <li>Make sure your document is clearly formatted</li>
                  <li>Check if the server is experiencing high load</li>
                </ul>
              </div>
            )}
          </div>
        )}
        <div className="border rounded-md p-4 h-80 overflow-y-auto bg-muted">
          <pre className="whitespace-pre-wrap text-sm">{extractedText}</pre>
        </div>
        <p className="text-sm text-muted-foreground">
          Review the extracted text above to make sure it's accurate. If it looks correct, proceed to mapping.
        </p>
        
        {selectedQuestionPaper !== 'default' ? (
          <Button 
            onClick={handleGetMappings} 
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mapping Questions...
              </>
            ) : 'Map Questions to Answers'}
          </Button>
        ) : (
          <Button 
            onClick={handleGetMappings} 
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : 'Proceed to Evaluation'}
          </Button>
        )}
      </div>
    </div>
  );
};

interface MapStepProps {
  mappedQuestions: Question[];
  handleMap: () => void;
  isProcessing: boolean;
  errorMessage?: string;
}

export const MapStep: React.FC<MapStepProps> = ({
  mappedQuestions,
  handleMap,
  isProcessing,
  errorMessage
}) => {
  // Check if the error is specifically a timeout
  const isTimeoutError = errorMessage?.toLowerCase().includes('timeout');

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Mapped Questions & Answers</h3>
      {errorMessage && (
        <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md text-sm">
          <p className="font-medium text-destructive mb-1">Error:</p>
          <p>{errorMessage}</p>
          {isTimeoutError && (
            <div className="mt-2 text-muted-foreground">
              <p className="font-medium">Suggestions:</p>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Try again with a simpler or shorter document</li>
                <li>Split your document into smaller sections</li>
                <li>Make sure your document is clearly formatted</li>
                <li>Check if the server is experiencing high load</li>
              </ul>
            </div>
          )}
        </div>
      )}
      <div className="space-y-4">
        {mappedQuestions.length > 0 ? (
          mappedQuestions.map((item, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Question {index + 1}</CardTitle>
                <CardDescription>{item.question}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">{item.answer}</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No questions mapped. {errorMessage ? 'See error above.' : 'Proceed to evaluation anyway.'}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Review the mapping of questions to answers before evaluation.
      </p>
      <Button 
        onClick={handleMap} 
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
            Processing...
          </>
        ) : (
          <>
            <Brain className="mr-2 h-4 w-4" />
            Evaluate Answers
          </>
        )}
      </Button>
    </div>
  );
};

interface EvaluateStepProps {
  evaluationResult: string;
  totalScore: string;
  fileUpload: File | null;
  handleSaveToHistory: () => void;
  setCurrentStep: (step: string) => void;
  errorMessage?: string;
}

export const EvaluateStep: React.FC<EvaluateStepProps> = ({
  evaluationResult,
  totalScore,
  fileUpload,
  handleSaveToHistory,
  setCurrentStep,
  errorMessage
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Evaluation Results</h3>
      {errorMessage && (
        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm mb-4">
          {errorMessage}
        </div>
      )}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div>
              <h3 className="font-medium">Total Score: {totalScore || 'Not Available'}</h3>
              <p className="text-sm text-muted-foreground">
                {evaluationResult.includes('Excellent') ? 'Excellent!' : 
                 evaluationResult.includes('Good') ? 'Good job!' : 
                 evaluationResult.includes('Average') ? 'Average performance.' : 
                 'Review completed.'}
              </p>
            </div>
            <Button variant="outline" onClick={() => {
              // Create a printable version
              const printWindow = window.open('', '_blank');
              if (printWindow) {
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Evaluation Results</title>
                      <style>
                        body {
                          font-family: Arial, sans-serif;
                          line-height: 1.6;
                          margin: 2rem;
                        }
                        pre {
                          white-space: pre-wrap;
                          background: #f5f5f5;
                          padding: 1rem;
                          border-radius: 4px;
                        }
                      </style>
                    </head>
                    <body>
                      <h1>Evaluation Results</h1>
                      <h2>Document: ${fileUpload?.name || 'Unknown'}</h2>
                      <h3>Total Score: ${totalScore || 'Not Available'}</h3>
                      <pre>${evaluationResult}</pre>
                    </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.print();
              }
            }}>Print Evaluation</Button>
          </div>
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm overflow-x-auto">
              {evaluationResult}
            </pre>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('upload')}>
          Start New Evaluation
        </Button>
        <Button onClick={handleSaveToHistory}>
          Save to History
        </Button>
      </div>
    </div>
  );
};
