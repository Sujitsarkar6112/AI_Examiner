import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, Clock, BarChart3 } from 'lucide-react';
import { useDashboard } from './DashboardContext';

interface StatusCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}

const StatusCard: React.FC<StatusCardProps> = ({ title, value, description, icon }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="rounded-full p-3 bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const DashboardContainer: React.FC = () => {
  const { setCurrentStep, evaluations, loading, error } = useDashboard();
  const [recentEvaluations, setRecentEvaluations] = useState<any[]>([]);
  
  useEffect(() => {
    // Load recent evaluations from localStorage
    const savedEvaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
    setRecentEvaluations(savedEvaluations.slice(0, 5)); // Display only the 5 most recent
  }, []);

  const stats = [
    {
      title: "Evaluated Papers",
      value: recentEvaluations.length || 0,
      description: "Total papers evaluated",
      icon: <FileText className="h-6 w-6" />
    },
    {
      title: "Average Score",
      value: recentEvaluations.length ? "75%" : "0%",
      description: "Across all evaluations",
      icon: <BarChart3 className="h-6 w-6" />
    },
    {
      title: "Recent Activity",
      value: recentEvaluations.length ? 
        new Date(recentEvaluations[0]?.timestamp || Date.now()).toLocaleDateString() : 
        "None",
      description: "Last evaluation date",
      icon: <Clock className="h-6 w-6" />
    }
  ];

  const handleStartEvaluation = () => {
    setCurrentStep('upload');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-indigo-950 dark:to-blue-950 border-none shadow-md">
        <CardContent className="p-8">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold mb-2">Welcome to AnswerEval!</h2>
            <p className="text-muted-foreground mb-6">
              Evaluate student answers automatically with the power of AI. Upload a question paper and student responses to get started.
            </p>
            <Button size="lg" onClick={handleStartEvaluation}>
              Start New Evaluation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatusCard 
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
          />
        ))}
      </div>
      
      {/* Recent Evaluations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Evaluations</CardTitle>
          <CardDescription>Your previously evaluated submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading evaluations...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">
              {error}
            </div>
          ) : recentEvaluations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
              <p className="mt-4 text-muted-foreground">No evaluation history found</p>
              <p className="text-sm text-muted-foreground">
                Start evaluating answers to build your history
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEvaluations.map((evaluation, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <h4 className="font-medium">{evaluation.fileName || `Evaluation ${index + 1}`}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(evaluation.timestamp || Date.now())}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-4 font-medium">
                      {evaluation.score || 0}/{evaluation.totalScore || 0}
                    </span>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardContainer;
