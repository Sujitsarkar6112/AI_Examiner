import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Eye, Edit, Upload, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { parseMarkdown } from '@/utils/markdownParser';
import CreateQuestionPaperDialog from './CreateQuestionPaperDialog';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateQuestionPaper from './CreateQuestionPaper';

interface Question {
  id: string;
  question: string;
  marks: number;
}

interface QuestionPaper {
  id: string;
  title: string;
  totalMarks: number;
  fileName: string;
  uploadDate: string;
  questions: Question[];
}

// Create an event emitter for cross-component communication
export const selectQuestionPaper = (paperId: string) => {
  // Create and dispatch a custom event with the selected question paper ID
  const event = new CustomEvent('questionPaperSelected', { 
    detail: { paperId } 
  });
  window.dispatchEvent(event);
  console.log(`Question paper selection event dispatched: ${paperId}`);
};

const QuestionPapersContainer: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<QuestionPaper | null>(null);
  const [selectedPaperId, setSelectedPaperId] = useState<string>('default');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  useEffect(() => {
    // Only fetch question papers if the user is authenticated
    if (isAuthenticated && !authLoading) {
      fetchQuestionPapers();
    }

    // Add event listener for question paper creation
    const handleQuestionPaperCreated = (event: CustomEvent) => {
      const { paper } = event.detail;
      setQuestionPapers(prev => [...prev, paper]);
      setActiveTab('view'); // Switch to the view tab after creation
    };

    window.addEventListener('questionPaperCreated', handleQuestionPaperCreated as EventListener);

    return () => {
      window.removeEventListener('questionPaperCreated', handleQuestionPaperCreated as EventListener);
    };
  }, [isAuthenticated, authLoading]);

  const fetchQuestionPapers = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      // Try to fetch from API first
      try {
        const response = await api.get('/question-papers');
        if (response.data && response.data.papers) {
          setQuestionPapers(response.data.papers);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.warn('API fetch failed, falling back to localStorage:', apiError);
        // If API fetch fails, fall back to localStorage
      }
      
      // Fallback to localStorage
      try {
        const papers = JSON.parse(localStorage.getItem('questionPapers') || '[]');
        setQuestionPapers(papers);
      } catch (err) {
        console.error('Error parsing question papers from localStorage:', err);
        setQuestionPapers([]);
      }
    } catch (error) {
      console.error('Error fetching question papers:', error);
      toast.error('Failed to load question papers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPaper = (paper: QuestionPaper) => {
    setSelectedPaper(paper);
    setViewDialogOpen(true);
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this question paper?')) {
      return;
    }
    
    try {
      // Try to delete from API first
      try {
        await api.delete(`/question-paper/${paperId}`);
        toast.success('Question paper deleted successfully');
      } catch (apiError) {
        console.warn('API delete failed, falling back to localStorage:', apiError);
        // If API delete fails, fall back to localStorage
      }

      // Delete from localStorage
      const papers = JSON.parse(localStorage.getItem('questionPapers') || '[]');
      const filteredPapers = papers.filter((p: QuestionPaper) => p.id !== paperId);
      localStorage.setItem('questionPapers', JSON.stringify(filteredPapers));
      
      setQuestionPapers(filteredPapers);
      
      // If the deleted paper was selected, reset to default
      if (selectedPaperId === paperId) {
        setSelectedPaperId('default');
        selectQuestionPaper('default');
      }
    } catch (error) {
      console.error('Error deleting question paper:', error);
      toast.error('Failed to delete question paper');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileUpload(file);
  };

  const handleUploadPaper = async () => {
    if (!fileUpload) {
      toast.error("Please select a file first");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        // Process file based on its type
        if (fileUpload.name.endsWith('.md')) {
          try {
            console.log("Reading markdown file content...");
            // Debug log to see what's in the file
            console.log("File content:", content.substring(0, 200) + "...");
            
            const parsedPaper = parseMarkdown(content);
            
            // Debug log to verify parsed content
            console.log('Parsed paper:', parsedPaper);
            
            if (parsedPaper.questions.length === 0) {
              toast.error('No questions found in the markdown file. Please check the format.');
              return;
            }
            
            const newPaper: QuestionPaper = {
              id: Date.now().toString(),
              title: parsedPaper.title || fileUpload.name,
              totalMarks: parsedPaper.totalMarks,
              fileName: fileUpload.name,
              uploadDate: new Date().toISOString(),
              questions: parsedPaper.questions.map((q, index) => ({
                id: `q-${index}`,
                question: q.question,
                marks: q.marks
              }))
            };
            
            // Try to save to API first
            try {
              const response = await api.post('/question-paper', newPaper);
              if (response.data && response.data.id) {
                // Use the ID returned from the server
                newPaper.id = response.data.id;
              }
            } catch (apiError) {
              console.warn('API save failed, falling back to localStorage:', apiError);
            }
            
            // Save to localStorage as well for backup
            const existingPapers = JSON.parse(localStorage.getItem('questionPapers') || '[]');
            const updatedPapers = [...existingPapers, newPaper];
            localStorage.setItem('questionPapers', JSON.stringify(updatedPapers));
            
            setQuestionPapers(updatedPapers);
            toast.success('Question paper uploaded successfully');
            setFileUpload(null);
            
            // Auto-select the newly uploaded paper
            setSelectedPaperId(newPaper.id);
            selectQuestionPaper(newPaper.id);
            
            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
          } catch (error) {
            console.error('Error parsing markdown:', error);
            toast.error('Failed to parse markdown file. Please check the format.');
          }
        } else {
          toast.error('Only markdown (.md) files are supported for now');
        }
      };
      
      reader.readAsText(fileUpload);
    } catch (error) {
      console.error('Error uploading question paper:', error);
      toast.error('Failed to upload question paper');
    }
  };

  const handleSelectPaper = (paperId: string) => {
    setSelectedPaperId(paperId);
    selectQuestionPaper(paperId);
    
    // Find the selected paper to update UI
    if (paperId !== 'default') {
      const paper = questionPapers.find(p => p.id === paperId);
      if (paper) {
        setSelectedPaper(paper);
      }
    } else {
      setSelectedPaper(null);
    }
  };

  const handleUsePaper = () => {
    if (selectedPaper) {
      handleSelectPaper(selectedPaper.id);
      setViewDialogOpen(false);
    }
  };

  const handlePaperCreated = (newPaper: QuestionPaper) => {
    setQuestionPapers(prev => [...prev, newPaper]);
    toast.success('Question paper created successfully');
    setCreateDialogOpen(false);
    
    // Auto-select the newly created paper
    setSelectedPaperId(newPaper.id);
    selectQuestionPaper(newPaper.id);
  };

  // Add this function back for navigation
  const navigateToUploadEvaluate = (paperId: string = 'default') => {
    // First ensure the selection event is triggered
    handleSelectPaper(paperId);
    
    // Save to localStorage for persistence
    localStorage.setItem('selectedQuestionPaperId', paperId);
    
    // Then navigate to the upload-evaluate page with query parameter
    setTimeout(() => {
      window.location.href = `#/upload-evaluate?paperId=${paperId}`;
    }, 100); // Small delay to ensure event is processed
  };

  // If still loading auth, show loading indicator
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">Initializing...</p>
      </div>
    );
  }

  // If not authenticated, show message
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to view question papers</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Question Paper</TabsTrigger>
          <TabsTrigger value="view">View Question Papers</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <CreateQuestionPaper />
        </TabsContent>

        <TabsContent value="view" className="space-y-4">
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Question Paper</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Question Paper</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="py-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      </div>
                    ) : questionPapers.length === 0 ? (
                      <div className="py-4">
                        <div className="rounded-md border border-dashed p-6 text-center">
                          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground mb-2">No question papers found</p>
                          <p className="text-xs text-muted-foreground">Upload a question paper to get started</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Default option for no question paper */}
                        <div className="flex items-center space-x-2 p-3 rounded-md border">
                          <input
                            type="radio"
                            id="no-paper"
                            name="question-paper"
                            className="h-4 w-4 border-gray-300 text-primary"
                            checked={selectedPaperId === 'default'}
                            onChange={() => handleSelectPaper('default')}
                          />
                          <label htmlFor="no-paper" className="text-sm font-medium leading-none flex-1">
                            No question paper (general evaluation)
                          </label>
                        </div>
                        
                        {questionPapers.map((paper) => (
                          <div 
                            key={paper.id}
                            className={`flex items-center space-x-2 p-3 rounded-md border hover:bg-accent ${
                              selectedPaperId === paper.id ? 'bg-accent/50' : ''
                            }`}
                          >
                            <input
                              type="radio"
                              id={`paper-${paper.id}`}
                              name="question-paper"
                              className="h-4 w-4 border-gray-300 text-primary"
                              checked={selectedPaperId === paper.id}
                              onChange={() => handleSelectPaper(paper.id)}
                            />
                            <label htmlFor={`paper-${paper.id}`} className="text-sm font-medium leading-none flex-1">
                              {paper.title}
                              <p className="text-xs text-muted-foreground mt-1">
                                {paper.questions.length} questions • {paper.totalMarks} marks
                              </p>
                            </label>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewPaper(paper);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePaper(paper.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex space-x-2 pt-4">
                      <Button 
                        variant="outline" 
                        className="w-1/2"
                        onClick={() => setCreateDialogOpen(true)}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Paper
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-1/2"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Paper
                      </Button>
                      <Input 
                        id="file-upload"
                        type="file" 
                        accept=".md" 
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                    
                    {fileUpload && (
                      <div className="mt-2">
                        <p className="text-sm truncate">{fileUpload.name}</p>
                        <Button 
                          className="w-full mt-2" 
                          onClick={handleUploadPaper}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Selected File
                        </Button>
                      </div>
                    )}
                    
                    <Card className="mt-4">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Supported File Formats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Currently only Markdown (.md) files are supported. Files should have:
                        </p>
                        <ul className="text-xs list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                          <li>Title as top-level heading (# Title)</li>
                          <li>Questions as numbered items (1. Question)</li>
                          <li>Marks in square brackets [5]</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {selectedPaper ? selectedPaper.title : 'General evaluation without structured questions'}
                    </CardTitle>
                    <CardDescription>
                      {selectedPaper 
                        ? `This question paper has ${selectedPaper.questions.length} questions worth a total of ${selectedPaper.totalMarks} marks.` 
                        : 'You can evaluate answers without a specific question paper. The AI will still provide detailed feedback.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedPaper ? (
                      <div className="space-y-6">
                        <div className="rounded-md bg-muted p-4">
                          <h3 className="text-sm font-medium mb-2">Questions Preview:</h3>
                          <div className="space-y-4 max-h-80 overflow-y-auto">
                            {selectedPaper.questions.map((question, index) => (
                              <div key={question.id} className="border rounded-md p-3 text-sm">
                                <div className="flex justify-between">
                                  <span className="font-medium">Question {index + 1}</span>
                                  <span>[{question.marks} marks]</span>
                                </div>
                                <p className="mt-1 whitespace-pre-wrap">{question.question}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <Button onClick={() => handleSelectPaper('default')} variant="outline" className="mr-2">
                            Switch to General Evaluation
                          </Button>
                          <Button onClick={() => navigateToUploadEvaluate(selectedPaper.id)}>
                            Continue with This Paper
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="rounded-md bg-muted p-4">
                          <p className="text-sm">This mode is useful when:</p>
                          <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                            <li>You want to evaluate free-form responses</li>
                            <li>You don't have a structured question paper</li>
                            <li>You want to evaluate essays or long-form answers</li>
                          </ul>
                        </div>
                        
                        <div>
                          <Button variant="outline" className="mr-2" onClick={() => setViewDialogOpen(true)}>
                            Browse Question Papers
                          </Button>
                          <Button onClick={() => navigateToUploadEvaluate()}>
                            Continue with No Question Paper
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Question Paper Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        {selectedPaper && (
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPaper.title}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="bg-muted rounded-md p-4 mb-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="text-sm text-muted-foreground mb-2">
                    Uploaded: {new Date(selectedPaper.uploadDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm font-medium">
                    Total Marks: {selectedPaper.totalMarks}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {selectedPaper.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-md p-4">
                    <div className="flex justify-between">
                      <h3 className="font-medium">Question {index + 1}</h3>
                      <span className="text-sm">[{question.marks} marks]</span>
                    </div>
                    <p className="mt-2 text-sm whitespace-pre-wrap">{question.question}</p>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                handleUsePaper();
                navigateToUploadEvaluate(selectedPaper.id);
              }}>
                Use This Paper
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      
      {/* Create Question Paper Dialog */}
      <CreateQuestionPaperDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onPaperCreated={handlePaperCreated}
      />
    </div>
  );
};

export default QuestionPapersContainer;
