import React from 'react';
import { FileUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UploadSection from '@/components/UploadSection';
import { useDashboard } from './DashboardContext';

const UploadStep: React.FC = () => {
  const { handleFileUpload } = useDashboard();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Upload PDF Document
        </CardTitle>
        <CardDescription>Upload a PDF containing answers to be evaluated</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          {/* Question paper selection moved to main content sidebar */}
        </div>
        <UploadSection onFileSelect={handleFileUpload} />
      </CardContent>
    </Card>
  );
};

export default UploadStep;
