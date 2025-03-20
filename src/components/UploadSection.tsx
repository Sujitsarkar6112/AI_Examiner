import React, { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Check if file is PDF, image, or text file
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'text/plain'];
    
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a PDF, image, or text file');
      return;
    }
    
    setFile(file);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcess = () => {
    if (!file) {
      toast.error('Please upload a file first');
      return;
    }
    
    // Call the onFileSelect prop with the selected file
    onFileSelect(file);
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div 
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/10' : 'border-border'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              {file.type.includes('pdf') ? (
                <FileText className="h-8 w-8 text-primary" />
              ) : file.type.includes('image') ? (
                <ImageIcon className="h-8 w-8 text-primary" />
              ) : (
                <FileText className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRemoveFile}>
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
              <Button size="sm" onClick={handleProcess}>
                <Upload className="h-4 w-4 mr-1" />
                Process
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.txt"
            />
            <div className="p-3 bg-muted/20 rounded-full inline-block mb-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">Upload your document</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop your PDF or image file here, or click to browse files
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Browse files
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadSection;
