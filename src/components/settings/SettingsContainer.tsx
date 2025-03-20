import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface AISettings {
  model: string;
  totalMarks: number;
  useAutoGrading: boolean;
  feedbackDetailLevel: number;
}

const SettingsContainer: React.FC = () => {
  const [settings, setSettings] = useState<AISettings>({
    model: 'gemini',
    totalMarks: 100,
    useAutoGrading: true,
    feedbackDetailLevel: 75,
  });

  const handleSaveSettings = () => {
    // Here you would typically save these settings to an API
    localStorage.setItem('aiSettings', JSON.stringify(settings));
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Settings</CardTitle>
          <CardDescription>
            Configure the AI model and evaluation parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="ai-model">AI Model</Label>
            <Select 
              value={settings.model} 
              onValueChange={(value) => setSettings({...settings, model: value})}
              disabled // Making it disabled as per requirement - Gemini only
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Google Gemini</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Currently only Google Gemini is supported
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total-marks">Default Total Marks</Label>
            <Input 
              id="total-marks"
              type="number" 
              value={settings.totalMarks}
              onChange={(e) => setSettings({...settings, totalMarks: parseInt(e.target.value) || 0})}
              min={0}
              max={1000}
            />
            <p className="text-xs text-muted-foreground">
              Default total marks for evaluations when not specified in question paper
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-grading">Auto Grading</Label>
              <Switch 
                id="auto-grading"
                checked={settings.useAutoGrading}
                onCheckedChange={(checked) => setSettings({...settings, useAutoGrading: checked})}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically grade answers during evaluation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-detail">Feedback Detail Level</Label>
            <div className="pt-2">
              <Slider
                id="feedback-detail"
                defaultValue={[settings.feedbackDetailLevel]}
                max={100}
                step={1}
                onValueChange={(values) => setSettings({...settings, feedbackDetailLevel: values[0]})}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-xs">Basic</span>
              <span className="text-xs">Detailed</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Level of detail provided in feedback: {settings.feedbackDetailLevel}%
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveSettings}>Save Settings</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question Paper Format</CardTitle>
          <CardDescription>
            Guide for creating markdown-formatted question papers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Question papers can be uploaded in Markdown format with the following structure:</p>
            
            <div className="bg-muted p-4 rounded-md">
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
{`# Math Quiz 2023

1. What is 2+2? [5]
2. Solve for x: 2x - 4 = 0 [10]
3. Find the derivative of f(x) = x² + 3x + 2 [15]

`}
              </pre>
            </div>
            
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Start with a title preceded by # (heading)</li>
              <li>Each question should be numbered</li>
              <li>Mark allocation in square brackets [x] at the end of each question</li>
              <li>The system will automatically calculate total marks</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsContainer;
