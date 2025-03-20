import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSavedEvaluations, EvaluationResult, deleteEvaluation } from '@/services/evaluation';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';

const EvaluationView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchEvaluation = async () => {
      setLoading(true);
      try {
        const evaluations = await getSavedEvaluations();
        const found = evaluations.find(e => e.id === id);
        
        if (found) {
          setEvaluation(found);
        } else {
          toast.error('Evaluation not found');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching evaluation:', error);
        toast.error('Failed to load evaluation');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvaluation();
  }, [id, navigate]);
  
  const handleDelete = async () => {
    if (!evaluation?.id) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteEvaluation(evaluation.id);
      if (success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      toast.error('Failed to delete evaluation');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const downloadEvaluation = () => {
    if (!evaluation) return;
    
    // Save as markdown file
    const blob = new Blob([evaluation.markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation-${evaluation.fileName.replace(/\.[^/.]+$/, '')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Evaluation not found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          className="gap-2"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={downloadEvaluation}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{evaluation.fileName}</h1>
        <p className="text-muted-foreground">
          Evaluated on {new Date(evaluation.timestamp).toLocaleString()}
        </p>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-muted rounded-md overflow-auto max-h-[80vh]">
            {evaluation.markdownContent}
          </pre>
        </CardContent>
      </Card>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Evaluation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this evaluation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EvaluationView;
