import React, { useState, useEffect } from 'react';
import { Settings, Download, Save, FileText } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getQuestionPapers, QuestionPaper, calculateTotalMarks } from '@/services/questionPaper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExtractedTextsPanel from './ExtractedTextsPanel';

export interface AiSettings {
  totalMarks: number;
  questionPaperId?: string;
  model: string;
  answerThreshold: number;
  feedbackLength: 'short' | 'medium' | 'detailed';
}

const defaultSettings: AiSettings = {
  totalMarks: 100,
  questionPaperId: undefined,
  model: 'gemini-pro',
  answerThreshold: 50,
  feedbackLength: 'medium',
};

const AiSettingsTab: React.FC = () => {
  const [settings, setSettings] = useLocalStorage<AiSettings>('ai-settings', defaultSettings);
  const [tempSettings, setTempSettings] = useState<AiSettings>(settings);
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<QuestionPaper | null>(null);
  const [isManualMarks, setIsManualMarks] = useState<boolean>(!settings.questionPaperId);

  // Fetch question papers
  useEffect(() => {
    const fetchQuestionPapers = async () => {
      try {
        const papers = await getQuestionPapers();
        setQuestionPapers(papers || []);
        
        // If we have a selected question paper ID, find and set it
        if (tempSettings.questionPaperId) {
          const selected = papers.find(p => p && p.id === tempSettings.questionPaperId);
          if (selected) {
            setSelectedPaper(selected);
            // Update total marks based on the selected paper
            const totalMarks = calculateTotalMarks(selected);
            if (totalMarks > 0) {
              setTempSettings(prev => ({...prev, totalMarks}));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching question papers:', error);
        toast.error('Failed to load question papers');
      }
    };
    
    fetchQuestionPapers();
  }, [tempSettings.questionPaperId]); // Add dependency to ensure it updates when the selected paper changes

  const handleQuestionPaperChange = (paperId: string) => {
    if (paperId === 'none') {
      setSelectedPaper(null);
      setTempSettings({
        ...tempSettings,
        questionPaperId: undefined
      });
      setIsManualMarks(true);
      return;
    }
    
    const selected = questionPapers.find(p => p && p.id === paperId);
    setSelectedPaper(selected || null);
    
    if (selected) {
      const totalMarks = calculateTotalMarks(selected);
      setTempSettings({
        ...tempSettings, 
        questionPaperId: paperId,
        totalMarks: totalMarks > 0 ? totalMarks : tempSettings.totalMarks
      });
      setIsManualMarks(false);
    } else {
      setTempSettings({
        ...tempSettings,
        questionPaperId: undefined
      });
      setIsManualMarks(true);
    }
  };

  const handleSaveSettings = () => {
    setSettings(tempSettings);
    toast.success('Settings saved successfully');
  };

  const handleDownloadSettings = () => {
    const settingsJSON = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'evaluation-settings.json';
    a.click();
    
    URL.revokeObjectURL(url);
    toast.success('Settings downloaded');
  };

  const handleReset = () => {
    setTempSettings(defaultSettings);
    setSelectedPaper(null);
    setIsManualMarks(true);
    toast.info('Settings reset to defaults');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card rounded-xl border shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-medium">AI Evaluation Settings</h2>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="settings" className="flex-1">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="extracted-texts" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            Extracted Texts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="question-paper">Question Paper</Label>
            <Select 
              value={tempSettings.questionPaperId || 'none'} 
              onValueChange={handleQuestionPaperChange}
            >
              <SelectTrigger id="question-paper">
                <SelectValue placeholder="Select question paper (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No question paper (manual)</SelectItem>
                {questionPapers && questionPapers.map(paper => (
                  paper && paper.id ? (
                    <SelectItem key={paper.id} value={paper.id}>
                      {paper.fileName || 'Unnamed Paper'} ({calculateTotalMarks(paper)} marks)
                    </SelectItem>
                  ) : null
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {selectedPaper 
                ? `Using marks from question paper: Total ${calculateTotalMarks(selectedPaper)} marks` 
                : 'No question paper selected, using manual total marks'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total-marks">Total Marks</Label>
            <Input
              id="total-marks"
              type="number"
              min={1}
              max={1000}
              value={tempSettings.totalMarks}
              onChange={(e) => {
                setIsManualMarks(true);
                setTempSettings({
                  ...tempSettings, 
                  totalMarks: parseInt(e.target.value) || 0,
                  questionPaperId: undefined
                });
                setSelectedPaper(null);
              }}
              disabled={!isManualMarks && !!selectedPaper}
            />
            <p className="text-sm text-muted-foreground">
              {!isManualMarks && selectedPaper 
                ? "Marks automatically set from question paper (select 'No question paper' to edit manually)" 
                : "Maximum score for the entire evaluation"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-selection">LLM Model</Label>
            <Select 
              value={tempSettings.model} 
              onValueChange={(value) => setTempSettings({...tempSettings, model: value})}
            >
              <SelectTrigger id="model-selection">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Select the AI model to use for evaluation</p>
          </div>

          <div className="space-y-2">
            <Label>Answer Threshold (%)</Label>
            <div className="pt-2">
              <Slider
                defaultValue={[tempSettings.answerThreshold]}
                max={100}
                step={1}
                onValueChange={(values) => setTempSettings({...tempSettings, answerThreshold: values[0]})}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Minimum: 0%</span>
              <span className="text-sm font-medium">{tempSettings.answerThreshold}%</span>
              <span className="text-sm text-muted-foreground">Maximum: 100%</span>
            </div>
            <p className="text-sm text-muted-foreground">Confidence threshold for answer identification</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-length">Feedback Detail Level</Label>
            <Select 
              value={tempSettings.feedbackLength} 
              onValueChange={(value: 'short' | 'medium' | 'detailed') => 
                setTempSettings({...tempSettings, feedbackLength: value})}
            >
              <SelectTrigger id="feedback-length">
                <SelectValue placeholder="Select feedback length" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (Concise feedback)</SelectItem>
                <SelectItem value="medium">Medium (Balanced feedback)</SelectItem>
                <SelectItem value="detailed">Detailed (Comprehensive feedback)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Level of detail in feedback provided</p>
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <Button onClick={handleSaveSettings} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
            <Button onClick={handleDownloadSettings} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleReset} variant="ghost" className="flex-1">
              Reset to Defaults
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="extracted-texts">
          <ExtractedTextsPanel settings={settings} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AiSettingsTab;
