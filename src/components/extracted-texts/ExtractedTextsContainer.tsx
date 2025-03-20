import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Check, FileText } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

interface ExtractedText {
  id: string;
  text: string;
  fileName: string;
  uploadDate: string;
}

export const ExtractedTextsContainer: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [selectedText, setSelectedText] = useState<ExtractedText | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchExtractedTexts();
    }
  }, [isAuthenticated]);

  const fetchExtractedTexts = async () => {
    try {
      // Try to fetch from API first
      try {
        const response = await api.get('/extracted-texts');
        if (response.data && response.data.texts) {
          setExtractedTexts(response.data.texts);
          return;
        }
      } catch (apiError) {
        console.warn('API fetch failed, falling back to localStorage:', apiError);
      }

      // Fallback to localStorage
      const savedTexts = localStorage.getItem('extractedTexts');
      if (savedTexts) {
        setExtractedTexts(JSON.parse(savedTexts));
      }
    } catch (error) {
      console.error('Error fetching extracted texts:', error);
      toast.error('Failed to load extracted texts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewText = (text: ExtractedText) => {
    setSelectedText(text);
  };

  const handleEvaluate = async (textId: string) => {
    setEvaluating(textId);
    try {
      // Navigate to upload & evaluate with the selected text
      navigate('/dashboard', { state: { tab: 'upload', textId } });
    } catch (error) {
      console.error('Failed to start evaluation:', error);
      toast.error('Failed to start evaluation');
    } finally {
      setEvaluating(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to view extracted texts</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading extracted texts...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Extracted Texts</h1>
        <Button variant="outline" onClick={fetchExtractedTexts}>Refresh</Button>
      </div>

      {extractedTexts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No extracted texts found. Upload a document to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {extractedTexts.map((extractedText) => (
            <Card
              key={extractedText.id}
              className="p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col h-full">
                <div className="flex-grow">
                  <h3 className="font-semibold mb-2 truncate">{extractedText.fileName}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {new Date(extractedText.uploadDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm line-clamp-3 mb-4">{extractedText.text}</p>
                </div>
                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleViewText(extractedText)}
                  >
                    View
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleEvaluate(extractedText.id)}
                    disabled={evaluating === extractedText.id}
                  >
                    {evaluating === extractedText.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Evaluate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedText} onOpenChange={() => setSelectedText(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedText?.fileName}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="mt-4 h-[60vh]">
            <div className="p-4 whitespace-pre-wrap">{selectedText?.text}</div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExtractedTextsContainer;
