
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { EvaluationResult } from '../services/evaluation';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Separator } from '../components/ui/separator';

interface EvaluationDetailProps {
  evaluation: EvaluationResult;
}

const EvaluationDetail: React.FC<EvaluationDetailProps> = ({ evaluation }) => {
  const navigate = useNavigate();
  const [parsedContent, setParsedContent] = useState<{
    overallScore?: number;
    maxScore?: number;
    feedback?: string;
    detailedResults?: Array<{
      questionNumber: number;
      questionText: string;
      answer: string;
      score: number;
      maxScore: number;
      feedback: string;
      keyPoints: string[];
      improvement: string;
    }>;
  }>({});
  
  useEffect(() => {
    // Try to parse the markdown content to extract structured data
    try {
      // This is a simple parser that assumes certain markdown structure
      // In a real application, you might want a more robust parsing solution
      const content = evaluation.markdownContent || '';
      
      // Extract overall score if available
      const overallScoreMatch = content.match(/Overall Score:\s*(\d+)\/(\d+)/i);
      const overallScore = overallScoreMatch ? parseInt(overallScoreMatch[1], 10) : undefined;
      const maxScore = overallScoreMatch ? parseInt(overallScoreMatch[2], 10) : undefined;
      
      // Extract overall feedback
      const feedbackMatch = content.match(/General Feedback:\s*([\s\S]*?)(?=\n\n|\n#|\n\*\*Question|$)/i);
      const feedback = feedbackMatch ? feedbackMatch[1].trim() : '';
      
      // Extract detailed results for questions if available
      const detailedResults: Array<{
        questionNumber: number;
        questionText: string;
        answer: string;
        score: number;
        maxScore: number;
        feedback: string;
        keyPoints: string[];
        improvement: string;
      }> = [];
      
      // Look for question sections
      const questionSections = content.match(/\*\*Question \d+[\s\S]*?(?=\*\*Question \d+|$)/g) || [];
      
      questionSections.forEach((section, idx) => {
        // Extract question number
        const questionNumberMatch = section.match(/\*\*Question (\d+)/i);
        const questionNumber = questionNumberMatch ? parseInt(questionNumberMatch[1], 10) : idx + 1;
        
        // Extract question text
        const questionTextMatch = section.match(/\*\*Question \d+\*\*:\s*([\s\S]*?)(?=\*\*Answer|\*\*Score|$)/i);
        const questionText = questionTextMatch ? questionTextMatch[1].trim() : '';
        
        // Extract answer
        const answerMatch = section.match(/\*\*Answer\*\*:\s*([\s\S]*?)(?=\*\*Score|\*\*Feedback|$)/i);
        const answer = answerMatch ? answerMatch[1].trim() : '';
        
        // Extract score
        const scoreMatch = section.match(/\*\*Score\*\*:\s*(\d+)\/(\d+)/i);
        const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
        const questionMaxScore = scoreMatch ? parseInt(scoreMatch[2], 10) : 0;
        
        // Extract feedback
        const questionFeedbackMatch = section.match(/\*\*Feedback\*\*:\s*([\s\S]*?)(?=\*\*Key Points|\*\*Improvement|$)/i);
        const questionFeedback = questionFeedbackMatch ? questionFeedbackMatch[1].trim() : '';
        
        // Extract key points
        const keyPointsSection = section.match(/\*\*Key Points\*\*:\s*([\s\S]*?)(?=\*\*Improvement|$)/i);
        const keyPointsText = keyPointsSection ? keyPointsSection[1].trim() : '';
        const keyPoints = keyPointsText
          .split('\n')
          .map(point => point.replace(/^-\s*/, '').trim())
          .filter(point => point.length > 0);
        
        // Extract improvement suggestion
        const improvementMatch = section.match(/\*\*Improvement\*\*:\s*([\s\S]*?)(?=$)/i);
        const improvement = improvementMatch ? improvementMatch[1].trim() : '';
        
        detailedResults.push({
          questionNumber,
          questionText,
          answer,
          score,
          maxScore: questionMaxScore,
          feedback: questionFeedback,
          keyPoints,
          improvement
        });
      });
      
      setParsedContent({
        overallScore,
        maxScore,
        feedback,
        detailedResults
      });
      
    } catch (error) {
      console.error('Error parsing markdown content:', error);
      setParsedContent({});
    }
  }, [evaluation.markdownContent]);
  
  // Format the date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Calculate the percentage score
  const calculatePercentage = () => {
    if (parsedContent.overallScore !== undefined && parsedContent.maxScore !== undefined && parsedContent.maxScore > 0) {
      return Math.round((parsedContent.overallScore / parsedContent.maxScore) * 100);
    }
    return null;
  };
  
  const percentage = calculatePercentage();
  
  // Determine the color based on the score
  const getScoreColor = (score: number, maxScore: number) => {
    const scorePercentage = (score / maxScore) * 100;
    if (scorePercentage >= 90) return 'text-green-500';
    if (scorePercentage >= 70) return 'text-blue-500';
    if (scorePercentage >= 50) return 'text-amber-500';
    return 'text-red-500';
  };
  
  const getScoreBackgroundColor = (score: number, maxScore: number) => {
    const scorePercentage = (score / maxScore) * 100;
    if (scorePercentage >= 90) return 'bg-green-500/10';
    if (scorePercentage >= 70) return 'bg-blue-500/10';
    if (scorePercentage >= 50) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };
  
  const handleBack = () => {
    navigate('/dashboard');
  };
  
  const handleDownload = () => {
    // Create a text version of the report
    const content = evaluation.markdownContent || 'No content available';
    
    // Create a blob and download link
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation-report-${evaluation.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Report downloaded successfully');
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
        
        <Button variant="secondary" onClick={handleDownload} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span>Download Report</span>
        </Button>
      </div>
      
      <Card className="p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{evaluation.fileName}</h1>
            <p className="text-muted-foreground">
              Evaluated on {formatDate(evaluation.timestamp)}
            </p>
          </div>
          
          {percentage !== null && (
            <div className="mt-4 md:mt-0 flex items-center">
              <div className="rounded-xl px-4 py-2 flex items-center gap-2 font-medium"
                   style={{ 
                     background: percentage >= 90 ? 'linear-gradient(135deg, #34d399, #10b981)' :
                                percentage >= 70 ? 'linear-gradient(135deg, #60a5fa, #3b82f6)' :
                                percentage >= 50 ? 'linear-gradient(135deg, #fbbf24, #d97706)' :
                                                'linear-gradient(135deg, #f87171, #ef4444)',
                     color: 'white'
                   }}>
                <span className="text-xl font-bold">{percentage}%</span>
                <span className="text-sm opacity-90">
                  ({parsedContent.overallScore}/{parsedContent.maxScore})
                </span>
              </div>
            </div>
          )}
        </div>
        
        {parsedContent.feedback && (
          <div className="p-4 rounded-lg bg-secondary/50 mb-6">
            <h3 className="font-medium mb-2">Overall Feedback</h3>
            <p>{parsedContent.feedback}</p>
          </div>
        )}
        
        {/* If we don't have parsed content or detailed results, show the raw markdown */}
        {(!parsedContent.detailedResults || parsedContent.detailedResults.length === 0) && (
          <div className="whitespace-pre-wrap font-mono text-sm p-4 border rounded-md">
            {evaluation.markdownContent}
          </div>
        )}
        
        {/* If we have parsed detailed results, show them nicely formatted */}
        {parsedContent.detailedResults && parsedContent.detailedResults.length > 0 && (
          <div className="space-y-8">
            {parsedContent.detailedResults.map((result, index) => (
              <div key={index} className="p-5 rounded-lg border">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg mb-2">
                    Question {result.questionNumber}
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(result.score, result.maxScore)} ${getScoreBackgroundColor(result.score, result.maxScore)}`}>
                    {result.score}/{result.maxScore}
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Question</p>
                  <p>{result.questionText}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Your Answer</p>
                  <p className="whitespace-pre-line">{result.answer}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Feedback</p>
                  <p>{result.feedback}</p>
                </div>
                
                {result.keyPoints.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Key Points</p>
                    <ul className="space-y-1 list-disc list-inside">
                      {result.keyPoints.map((point, idx) => (
                        <li key={idx} className="text-sm">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {result.improvement && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Improvement Suggestion</p>
                    <p className="text-sm italic">{result.improvement}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default EvaluationDetail;
