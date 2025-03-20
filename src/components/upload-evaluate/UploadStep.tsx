import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from "@/components/ui/card";

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
  handleUpload: (file: File) => Promise<void>;
  isProcessing: boolean;
  selectedQuestionPaper: string;
  questionPaperData: QuestionPaper | null;
  processingError: string | null;
}

const UploadStep: React.FC<UploadStepProps> = ({
  fileUpload,
  handleFileChange,
  handleUpload,
  isProcessing,
  selectedQuestionPaper,
  questionPaperData,
  processingError
}) => {
  const onUpload = () => {
    if (!fileUpload) {
      toast.error("Please select a file first");
      return;
    }
    handleUpload(fileUpload);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base" htmlFor="file-upload">Upload a PDF file to extract and evaluate answers</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Choose a PDF file containing the answers you want to evaluate.
                </p>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {fileUpload ? (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-primary" />
                      <p className="text-sm font-medium">{fileUpload.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(fileUpload.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Drag & drop your file here or click below to browse
                      </p>
                    </div>
                  )}
                  <div className="mt-4">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      disabled={isProcessing}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={isProcessing}
                    >
                      Choose File
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  onClick={onUpload}
                  disabled={!fileUpload || isProcessing}
                  className="w-full sm:w-auto"
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
          </CardContent>
        </Card>

        {processingError && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-destructive space-y-2">
                <p className="font-medium">Error occurred while processing the file:</p>
                <p>{processingError}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UploadStep; 