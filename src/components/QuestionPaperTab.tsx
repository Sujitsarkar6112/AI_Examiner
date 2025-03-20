import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, File as FileIcon, PackagePlus, Loader2, Check, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  processQuestionPaper, 
  saveQuestionPaper, 
  getQuestionPapers,
  deleteQuestionPaper,
  Question,
  QuestionPaper
} from '../services/questionPaper';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';

const QuestionPaperTab: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [allPapers, setAllPapers] = useState<QuestionPaper[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    fetchQuestionPapers();
  }, []);

  const fetchQuestionPapers = async () => {
    setLoadingPapers(true);
    try {
      const papers = await getQuestionPapers();
      setAllPapers(papers);
    } catch (error) {
      console.error('Error fetching question papers:', error);
      toast.error('Failed to load question papers');
    } finally {
      setLoadingPapers(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/markdown', 
      'application/json',
      'text/plain'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    // Check the file extension for JSON and Markdown specifically
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isMdOrJson = fileExtension === 'md' || fileExtension === 'markdown' || fileExtension === 'json';
    
    if (!validTypes.includes(file.type) && !isMdOrJson) {
      toast.error('Please upload a valid file (PDF, Word, Markdown, or JSON)');
      return;
    }
    
    if (file.size > maxSize) {
      toast.error('File is too large. Please upload a file smaller than 10MB');
      return;
    }
    
    setFile(file);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcessFile = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // The processQuestionPaper now returns the complete QuestionPaper object
      const questionPaper = await processQuestionPaper(file);
      
      // Update state with the returned question paper data
      setQuestions(questionPaper.questions);
      await fetchQuestionPapers();
      
      toast.success('Question paper processed successfully!');
      setActiveTab('questions');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred during processing');
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    
    if (file.type.includes('pdf')) {
      return <FileText className="h-6 w-6 text-primary" />;
    } else if (file.type.includes('word')) {
      return <FileIcon className="h-6 w-6 text-primary" />;
    } else {
      return <FileText className="h-6 w-6 text-primary" />;
    }
  };

  const updateQuestionMark = (id: string, marks: number) => {
    setQuestions(questions.map(q => 
      q.id === id ? {...q, marks} : q
    ));
  };

  const saveQuestions = async () => {
    if (!file) return;
    
    try {
      // Save the updated questions
      await saveQuestionPaper(file.name, questions);
      await fetchQuestionPapers();
      toast.success('Question paper saved successfully');
    } catch (error) {
      console.error('Error saving question paper:', error);
      toast.error('Failed to save question paper');
    }
  };

  const confirmDelete = (id: string) => {
    setPaperToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!paperToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteQuestionPaper(paperToDelete);
      if (success) {
        await fetchQuestionPapers();
        toast.success('Question paper deleted successfully');
      } else {
        toast.error('Failed to delete question paper');
      }
    } catch (error) {
      console.error('Error deleting question paper:', error);
      toast.error('An error occurred while deleting');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setPaperToDelete(null);
    }
  };

  const loadQuestionPaper = (paper: QuestionPaper) => {
    setQuestions(paper.questions);
    
    // Create a mock file object from the filename
    // Use the global window.File constructor instead of the imported File component
    const mockFile = new window.File([""], paper.fileName);
    setFile(mockFile);
    
    // Switch to the questions tab to display the loaded paper
    setActiveTab('questions');
    
    toast.success(`Loaded question paper: ${paper.fileName}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Upload Question Paper</span>
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2" disabled={questions.length === 0}>
            <FileText className="h-4 w-4" />
            <span>Questions ({questions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Saved Papers ({allPapers.length})</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="pt-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">Upload Question Paper</h2>
            <p className="text-muted-foreground">
              Upload a question paper file in PDF, Word, or Markdown format
            </p>
          </div>
          
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-secondary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!file ? (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <PackagePlus className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Drag and drop your question paper</h3>
                  <p className="text-sm text-muted-foreground">
                    or click to browse (PDF, Word, Markdown up to 10MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.md,.txt,.json"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-outline"
                >
                  Select File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  {getFileIcon()}
                  <span className="font-medium">{file.name}</span>
                  <button 
                    onClick={removeFile}
                    disabled={isProcessing}
                    className="ml-2 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={handleProcessFile}
                    disabled={isProcessing}
                    className={`btn-primary ${isProcessing ? 'opacity-80 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing file...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Process Question Paper</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {isProcessing && (
            <div className="mt-6 text-center space-y-4">
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full animate-pulse-soft w-full"></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Extracting questions from the document. Please wait...
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="questions" className="pt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Questions from {file?.name}
                </h2>
                <Button onClick={saveQuestions}>
                  <Check className="h-4 w-4 mr-2" />
                  Save Questions
                </Button>
              </div>
              
              <Separator className="mb-4" />
              
              <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="mb-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">Q{index + 1}.</span>
                          <p className="flex-1">{question.text}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Marks:</span>
                        <div className="flex items-center">
                          <span className="mr-1">[</span>
                          <Input
                            type="number"
                            min="1"
                            className="w-16"
                            value={question.marks}
                            onChange={(e) => updateQuestionMark(question.id, parseInt(e.target.value) || 0)}
                          />
                          <span className="ml-1">]</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="saved" className="pt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Saved Question Papers
                </h2>
                <Button 
                  variant="outline"
                  onClick={fetchQuestionPapers}
                  disabled={loadingPapers}
                >
                  {loadingPapers ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Refresh</span>
                  )}
                </Button>
              </div>
              
              <Separator className="mb-4" />
              
              {loadingPapers ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : allPapers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No saved question papers found</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                  <div className="space-y-4">
                    {allPapers.map((paper) => (
                      <Card key={paper.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{paper.fileName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(paper.timestamp).toLocaleString()} • 
                                {paper.questions.length} questions
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => loadQuestionPaper(paper)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => confirmDelete(paper.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question paper? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionPaperTab;
