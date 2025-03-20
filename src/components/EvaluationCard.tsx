import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FileText, BarChart, Star } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EvaluationResult } from '@/services/evaluation';

interface EvaluationCardProps {
  evaluation: EvaluationResult;
}

const EvaluationCard: React.FC<EvaluationCardProps> = ({ evaluation }) => {
  const navigate = useNavigate();
  
  // Extract score information from Markdown if available
  const extractScoreFromMarkdown = (markdown: string | null | undefined): { score: number | null, totalMarks: number | null, percentage: number | null } => {
    // Check if markdown is a valid string
    if (!markdown || typeof markdown !== 'string') {
      return { score: null, totalMarks: null, percentage: null };
    }
    
    // Look for score patterns in the markdown
    const scoreMatch = markdown.match(/(?:Total Score|Final Score|Overall Score):\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?/i);
    
    if (scoreMatch) {
      const score = parseFloat(scoreMatch[1]);
      let totalMarks = scoreMatch[2] ? parseFloat(scoreMatch[2]) : null;
      
      // If no total marks in score format, try to find separately
      if (!totalMarks) {
        const totalMarksMatch = markdown.match(/(?:Total Marks|Maximum Score):\s*(\d+(?:\.\d+)?)/i);
        totalMarks = totalMarksMatch ? parseFloat(totalMarksMatch[1]) : 100; // Default to 100 if not found
      }
      
      const percentage = totalMarks ? (score / totalMarks) * 100 : null;
      
      return { score, totalMarks, percentage };
    }
    
    // Try alternate formats
    const gradingMatch = markdown.match(/(?:Grade|Grading):\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?/i);
    if (gradingMatch) {
      const score = parseFloat(gradingMatch[1]);
      const totalMarks = gradingMatch[2] ? parseFloat(gradingMatch[2]) : 100;
      const percentage = (score / totalMarks) * 100;
      return { score, totalMarks, percentage };
    }
    
    // Check for percentage directly
    const percentMatch = markdown.match(/(\d+(?:\.\d+)?)%/);
    if (percentMatch) {
      const percentage = parseFloat(percentMatch[1]);
      return { score: percentage, totalMarks: 100, percentage };
    }
    
    return { score: null, totalMarks: null, percentage: null };
  };
  
  const getScoreColor = (percentage: number | null): string => {
    if (percentage === null) return 'bg-gray-200 text-gray-700';
    
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-blue-100 text-blue-800';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };
  
  const { score, totalMarks, percentage } = evaluation.markdownContent ? 
    extractScoreFromMarkdown(evaluation.markdownContent) : 
    { score: null, totalMarks: null, percentage: null };
  
  const scoreDisplay = score !== null && totalMarks !== null 
    ? `${score}/${totalMarks}` 
    : score !== null 
      ? `${score}` 
      : 'N/A';
  
  const percentageDisplay = percentage !== null 
    ? `${percentage.toFixed(1)}%` 
    : 'N/A';
  
  // Extract a brief summary from the markdown content
  const extractSummary = (markdown: string | null | undefined): string => {
    // Check if markdown is a valid string
    if (!markdown || typeof markdown !== 'string') {
      return 'No content available';
    }
    
    // Look for a summary or feedback section
    const summaryMatch = markdown.match(/(?:Summary|Feedback|Overall Comments|Comments):(.*?)(?:\n\n|\n#|$)/is);
    if (summaryMatch && summaryMatch[1]) {
      return summaryMatch[1].trim().substring(0, 120) + '...';
    }
    
    // If no summary section, take the first paragraph that's not a heading
    const paragraphs = markdown.split('\n\n');
    for (const paragraph of paragraphs) {
      if (!paragraph.startsWith('#') && paragraph.length > 10) {
        return paragraph.trim().substring(0, 120) + '...';
      }
    }
    
    return 'No summary available';
  };
  
  const summary = evaluation.markdownContent ? extractSummary(evaluation.markdownContent) : 'No content available';
  
  const handleViewEvaluation = () => {
    navigate(`/evaluation/${evaluation.id}`);
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-medium line-clamp-1">{evaluation.fileName}</CardTitle>
          </div>
          {percentage !== null && (
            <Badge className={getScoreColor(percentage)}>
              {percentageDisplay}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {evaluation.timestamp ? formatDate(evaluation.timestamp) : 'Unknown date'}
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 pb-4">
        {score !== null && (
          <div className="flex items-center gap-2 mb-2">
            <BarChart className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Score: {scoreDisplay}</span>
          </div>
        )}
        <p className="text-sm text-muted-foreground line-clamp-3">{summary}</p>
      </CardContent>
      
      <CardFooter className="pt-0 pb-3">
        <Button variant="outline" size="sm" className="w-full" onClick={handleViewEvaluation}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EvaluationCard;
