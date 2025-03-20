import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Eye, Download, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { toast } from 'sonner';

interface Evaluation {
  id: string;
  fileName: string;
  timestamp: string;
  score: number;
  totalScore: number;
  markdownContent: string;
}

const EvaluationHistory: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    // Only fetch evaluations if the user is authenticated
    if (isAuthenticated && !authLoading) {
      fetchEvaluations();
    }
  }, [isAuthenticated, authLoading]);

  const fetchEvaluations = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    
    try {
      // Try to fetch from API first
      try {
        const response = await api.get('/evaluations');
        console.log('Evaluation data received:', response.data);
        if (response.data && Array.isArray(response.data)) {
          setEvaluations(response.data);
        } else {
          console.warn('API response is not an array or is empty:', response.data);
          // If API response is not valid, fall back to localStorage
          const savedEvaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
          setEvaluations(savedEvaluations);
        }
      } catch (apiError) {
        console.warn('API fetch failed, falling back to localStorage:', apiError);
        // If API fetch fails, fall back to localStorage
        const savedEvaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
        setEvaluations(savedEvaluations);
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      toast.error('Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  const handleViewEvaluation = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setViewDialogOpen(true);
  };

  const clearEvaluationHistory = async () => {
    if (!confirm('Are you sure you want to clear your evaluation history? This action cannot be undone.')) {
      return;
    }
    
    setClearing(true);
    
    try {
      // Try to clear from API first
      try {
        await api.delete('/evaluations/clear');
        toast.success('Evaluation history cleared successfully');
      } catch (apiError) {
        console.warn('API clear failed, falling back to localStorage:', apiError);
        // If API clear fails, fall back to localStorage
      }
      
      // Clear from localStorage
      localStorage.removeItem('evaluations');
      setEvaluations([]);
    } catch (error) {
      console.error('Error clearing evaluation history:', error);
      toast.error('Failed to clear evaluation history');
    } finally {
      setClearing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // If still loading auth, show loading indicator
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">Initializing...</p>
      </div>
    );
  }

  // If not authenticated, show message
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to view evaluation history</p>
      </div>
    );
  }

  // Log the current state for debugging
  console.log('Current evaluations state:', { 
    loading, 
    evaluationsLength: evaluations.length, 
    evaluations 
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Evaluation History</CardTitle>
          <CardDescription>
            View your previously evaluated answer submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4 space-x-2">
            <Button 
              variant="outline" 
              onClick={fetchEvaluations}
              disabled={loading}
              className="text-primary hover:bg-primary/10"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearEvaluationHistory}
              disabled={clearing || evaluations.length === 0}
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              {clearing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear History
                </>
              )}
            </Button>
          </div>
          
          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading evaluations...</p>
            </div>
          ) : evaluations.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
              <p className="text-muted-foreground">No evaluation history found</p>
              <p className="text-sm text-muted-foreground">
                Start evaluating answers to build your history
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {evaluations.map((evaluation) => (
                  <div key={evaluation.id || `eval-${evaluation.timestamp}`} className="border rounded-md p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="flex-1 mb-3 md:mb-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-medium">{evaluation.fileName || evaluation.filename}</h3>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span>Score: {evaluation.score}/{evaluation.totalScore || evaluation.total_score}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(evaluation.timestamp)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewEvaluation(evaluation)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* View Evaluation Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        {selectedEvaluation && (
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedEvaluation.fileName || selectedEvaluation.filename}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="bg-muted rounded-md p-4 mb-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="text-sm text-muted-foreground mb-2">
                    Evaluated on: {formatDate(selectedEvaluation.timestamp)}
                  </div>
                  <div className="text-sm font-medium">
                    Score: {selectedEvaluation.score}/{selectedEvaluation.totalScore || selectedEvaluation.total_score}
                  </div>
                </div>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm overflow-x-auto">
                  {typeof selectedEvaluation.markdownContent === 'string' 
                    ? selectedEvaluation.markdownContent 
                    : typeof selectedEvaluation.evaluation === 'string' 
                      ? selectedEvaluation.evaluation
                      : JSON.stringify(selectedEvaluation.markdownContent || selectedEvaluation.evaluation, null, 2)}
                </pre>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-1" />
                Export PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default EvaluationHistory;
