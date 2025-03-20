import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileType, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { parseMarkdown } from '@/utils/markdownParser';

interface QuestionPaperUploaderProps {
  onSuccess?: () => void;
}

const QuestionPaperUploader: React.FC<QuestionPaperUploaderProps> = ({ onSuccess }) => {
  const [uploadTab, setUploadTab] = useState('file');
  const [file, setFile] = useState<File | null>(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // If it's a markdown file, preview the content
      if (selectedFile.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setMarkdownContent(content);
        };
        reader.readAsText(selectedFile);
      }
    }
  };

  const handleUploadFile = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      // For markdown files, use the parseMarkdown function locally
      if (file.name.endsWith('.md')) {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            const parsedPaper = parseMarkdown(content);
            
            if (parsedPaper.questions.length === 0) {
              toast.warning('No valid questions found in the markdown file');
              return;
            }
            
            // Store the question paper in localStorage for demo purposes
            // In a real application, this would be sent to an API
            const existingPapers = JSON.parse(localStorage.getItem('questionPapers') || '[]');
            const newPaper = {
              id: Date.now().toString(),
              title: parsedPaper.title,
              totalMarks: parsedPaper.totalMarks,
              fileName: file.name,
              uploadDate: new Date().toISOString(),
              questions: parsedPaper.questions
            };
            
            existingPapers.push(newPaper);
            localStorage.setItem('questionPapers', JSON.stringify(existingPapers));
            
            toast.success(`Question paper "${parsedPaper.title}" uploaded with ${parsedPaper.questions.length} questions`);
            setFile(null);
            setMarkdownContent('');
            
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            
            // Call the onSuccess callback if provided
            if (onSuccess) {
              onSuccess();
            }
          } catch (error) {
            console.error('Error parsing markdown:', error);
            toast.error('Failed to parse markdown file');
          } finally {
            setIsUploading(false);
          }
        };
        
        reader.onerror = () => {
          toast.error('Failed to read file');
          setIsUploading(false);
        };
        
        reader.readAsText(file);
      } else {
        // For other file types, simulate upload success for now
        // In a real application, this would send the file to a backend API
        setTimeout(() => {
          toast.success(`File "${file.name}" uploaded successfully`);
          setFile(null);
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          // Call the onSuccess callback if provided
          if (onSuccess) {
            onSuccess();
          }
          setIsUploading(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Error uploading question paper:', error);
      toast.error('Failed to upload question paper');
      setIsUploading(false);
    }
  };

  const handleCreateMarkdown = async () => {
    if (!markdownContent.trim()) {
      toast.error('Please enter markdown content');
      return;
    }

    try {
      // Attempt to parse the markdown to validate format
      const parsed = parseMarkdown(markdownContent);
      if (parsed.questions.length === 0) {
        toast.warning('No valid questions found. Please check the format.');
        return;
      }

      setIsUploading(true);
      
      // Store the question paper in localStorage for demo purposes
      // In a real application, this would be sent to an API
      const existingPapers = JSON.parse(localStorage.getItem('questionPapers') || '[]');
      const newPaper = {
        id: Date.now().toString(),
        title: parsed.title,
        totalMarks: parsed.totalMarks,
        fileName: `${parsed.title.replace(/\s+/g, '-').toLowerCase()}.md`,
        uploadDate: new Date().toISOString(),
        questions: parsed.questions
      };
      
      existingPapers.push(newPaper);
      localStorage.setItem('questionPapers', JSON.stringify(existingPapers));
      
      toast.success(`Question paper created with ${parsed.questions.length} questions and ${parsed.totalMarks} total marks`);
      setMarkdownContent('');
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating question paper:', error);
      toast.error('Failed to create question paper');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Question Paper</CardTitle>
        <CardDescription>
          Upload a new question paper or create one using markdown format
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={uploadTab} onValueChange={setUploadTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <FileType className="h-4 w-4" />
              <span>Upload File</span>
            </TabsTrigger>
            <TabsTrigger value="markdown" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Create with Markdown</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question-paper-file">Select File</Label>
              <Input
                id="question-paper-file"
                type="file"
                ref={fileInputRef}
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileSelect}
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOCX, TXT, MD
              </p>
            </div>
            
            {file && (
              <div className="bg-muted rounded-md p-3">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleUploadFile} 
              disabled={!file || isUploading} 
              className="w-full mt-4 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-r-transparent animate-spin rounded-full"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload Question Paper</span>
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="markdown" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="markdown-content">Markdown Content</Label>
              <Textarea
                id="markdown-content"
                placeholder="# Title of Question Paper

1. First question [5]
2. Second question [10]
..."
                className="min-h-[250px] font-mono"
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use markdown format with question marks in [x] format
              </p>
            </div>
            
            {markdownContent && (
              <div className="bg-muted/50 rounded-md p-4 mt-4">
                <h3 className="text-sm font-medium mb-2">Preview</h3>
                {(() => {
                  try {
                    const parsed = parseMarkdown(markdownContent);
                    return (
                      <div className="space-y-3 text-sm">
                        <p>Title: <span className="font-medium">{parsed.title}</span></p>
                        <p>Total Marks: <span className="font-medium">{parsed.totalMarks}</span></p>
                        <p>Questions: <span className="font-medium">{parsed.questions.length}</span></p>
                      </div>
                    );
                  } catch (e) {
                    return (
                      <p className="text-xs text-red-500">
                        Could not parse markdown. Please check format.
                      </p>
                    );
                  }
                })()}
              </div>
            )}
            
            <Button 
              onClick={handleCreateMarkdown} 
              disabled={!markdownContent.trim() || isUploading} 
              className="w-full mt-4"
            >
              {isUploading ? 'Creating...' : 'Create Question Paper'}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t pt-4">
        <div className="space-y-2">
          <p className="font-medium">Markdown Format Example:</p>
          <pre className="bg-muted p-2 rounded-md whitespace-pre-wrap">
{`# Math Quiz 2023

1. What is 2+2? [5]
2. Solve for x: 2x - 4 = 0 [10]`}
          </pre>
        </div>
      </CardFooter>
    </Card>
  );
};

export default QuestionPaperUploader;
