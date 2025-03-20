import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, FileText, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { OCRHistory } from '@/services/ocr';
import { useExtraction } from './ExtractionContext';

interface ExtractionHistoryListProps {
  onViewExtraction?: (extraction: OCRHistory) => void;
}

const ExtractionHistoryList: React.FC<ExtractionHistoryListProps> = ({ 
  onViewExtraction 
}) => {
  const { 
    extractionHistory, 
    selectedExtraction, 
    isLoading, 
    isDeleting,
    handleViewExtraction,
    confirmDelete
  } = useExtraction();

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading extraction history...</p>
      </div>
    );
  }

  if (extractionHistory.length === 0) {
    return (
      <div className="py-8 text-center">
        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">No extraction history found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {extractionHistory.map((extraction) => (
          <Card 
            key={extraction.id}
            className={`cursor-pointer transition-colors hover:bg-muted ${
              selectedExtraction?.id === extraction.id ? 'bg-muted ring-1 ring-primary' : ''
            }`}
            onClick={() => handleViewExtraction(extraction)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{extraction.fileName}</h4>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {extraction.timestamp 
                        ? format(new Date(extraction.timestamp), 'MMM d, yyyy h:mm a')
                        : 'Unknown date'}
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={isDeleting}
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(extraction.id);
                  }}
                >
                  {isDeleting && extraction.id === selectedExtraction?.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
              {extraction.pageCount && (
                <div className="text-xs text-muted-foreground mt-2">
                  Pages: {extraction.pageCount}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ExtractionHistoryList;
