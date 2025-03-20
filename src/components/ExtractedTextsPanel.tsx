import React, { useState, useEffect } from 'react';
import { getExtractedTexts, evaluateExtractedText, ExtractedText } from '../services/extractedText';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AiSettings } from './AiSettingsTab';

interface ExtractedTextsPanelProps {
  settings: AiSettings;
}

const ExtractedTextsPanel: React.FC<ExtractedTextsPanelProps> = ({ settings }) => {
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExtractedTexts();
  }, []);

  const fetchExtractedTexts = async () => {
    setLoading(true);
    try {
      const texts = await getExtractedTexts();
      setExtractedTexts(texts);
    } catch (error) {
      console.error('Error fetching extracted texts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (textId: string) => {
    setEvaluating(textId);
    try {
      const result = await evaluateExtractedText(textId, settings.questionPaperId);
      toast.success('Evaluation completed successfully');
      // Navigate to the evaluation view
      navigate(`/evaluation/${result.id}`);
    } catch (error) {
      console.error('Evaluation failed:', error);
      toast.error('Evaluation failed. Please try again.');
    } finally {
      setEvaluating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading extracted texts...</span>
      </div>
    );
  }

  if (extractedTexts.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/10">
        <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium">No extracted texts found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload and process documents first to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Previously Extracted Texts</h3>
        <Button variant="outline" size="sm" onClick={fetchExtractedTexts}>
          Refresh
        </Button>
      </div>
      
      <ScrollArea className="h-[400px] rounded-md border p-4">
        <div className="space-y-4">
          {extractedTexts.map((text) => (
            <Card key={text.id} className="hover:bg-accent/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{text.fileName}</CardTitle>
                <CardDescription>
                  {text.timestamp && formatDistanceToNow(new Date(text.timestamp), { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">{text.text}</p>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleEvaluate(text.id)} 
                  disabled={evaluating === text.id}
                  className="w-full"
                >
                  {evaluating === text.id ? (
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
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ExtractedTextsPanel;
