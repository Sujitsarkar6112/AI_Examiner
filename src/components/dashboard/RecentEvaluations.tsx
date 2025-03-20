import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EvaluationResult } from '@/services/evaluation';

interface RecentEvaluationsProps {
  evaluations: EvaluationResult[];
  onViewEvaluation: (evaluation: EvaluationResult) => void;
}

const RecentEvaluations: React.FC<RecentEvaluationsProps> = ({ evaluations, onViewEvaluation }) => {
  // Helper function to get score from markdown content
  const extractTotalScore = (content: string | any): string => {
    // Check if content is a string before trying to use match
    if (typeof content !== 'string') {
      return 'N/A';
    }
    
    const scoreMatch = content.match(/## Total Score: (\d+(\.\d+)?)\s*\/\s*(\d+(\.\d+)?)/i);
    if (scoreMatch) {
      return `${scoreMatch[1]}/${scoreMatch[3]}`;
    }
    return 'N/A';
  };

  if (evaluations.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>No recent evaluations found</p>
        <p className="text-xs mt-2">Upload and evaluate documents to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {evaluations.map((evaluation, index) => {
        const score = extractTotalScore(evaluation.markdownContent);
        const timestamp = new Date(evaluation.timestamp);
        
        return (
          <div key={index} className="border rounded-md p-3 hover:bg-muted transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <File className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium line-clamp-1">
                    {evaluation.fileName.split('.')[0]}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                    <span>{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
                    <span>•</span>
                    <span>Score: {score}</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => onViewEvaluation(evaluation)}
              >
                <ArrowRight className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentEvaluations;
