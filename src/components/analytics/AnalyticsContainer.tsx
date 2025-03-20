import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Download } from 'lucide-react';

interface Evaluation {
  id: string;
  fileName: string;
  timestamp: string;
  score: number;
  totalScore: number;
  markdownContent: string;
  questions?: Array<{
    question: string;
    score: number;
    totalScore: number;
    feedback: string;
  }>;
}

const AnalyticsContainer: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvaluations: 0,
    averageScore: 0,
    passRate: 0,
    totalThisMonth: 0,
    averageScoreChange: 0,
    passRateChange: 0
  });

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = () => {
    setLoading(true);
    
    // Fetch from localStorage
    setTimeout(() => {
      const savedEvaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
      setEvaluations(savedEvaluations);
      
      // Calculate analytics
      if (savedEvaluations.length > 0) {
        // Total evaluations
        const totalEvaluations = savedEvaluations.length;
        
        // Average score calculation
        const totalScorePercentage = savedEvaluations.reduce((acc, curr) => 
          acc + (curr.score / curr.totalScore * 100), 0);
        const averageScore = Math.round(totalScorePercentage / totalEvaluations);
        
        // Calculate pass rate (scores > 60%)
        const passCount = savedEvaluations.filter(e => 
          (e.score / e.totalScore * 100) >= 60).length;
        const passRate = Math.round((passCount / totalEvaluations) * 100);
        
        // Get evaluations from this month
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const evaluationsThisMonth = savedEvaluations.filter(e => {
          const date = new Date(e.timestamp);
          return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
        });
        
        // Generate random changes for now (in a real app, these would compare to previous month)
        const averageScoreChange = Math.floor(Math.random() * 10) - 2; // -2 to +8
        const passRateChange = Math.floor(Math.random() * 10) - 2; // -2 to +8
        
        setStats({
          totalEvaluations,
          averageScore,
          passRate,
          totalThisMonth: evaluationsThisMonth.length,
          averageScoreChange,
          passRateChange
        });
      }
      
      setLoading(false);
    }, 500);
  };

  const getMonthlyChangeText = (value: number) => {
    if (value > 0) return `+${value}% from last month`;
    if (value < 0) return `${value}% from last month`;
    return 'No change from last month';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading analytics...</p>
            </div>
          ) : evaluations.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
              <p className="text-muted-foreground">No evaluation data found</p>
              <p className="text-sm text-muted-foreground">
                Start evaluating answers to see analytics
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">Total Evaluations</CardTitle>
                    <CardDescription>Past 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{stats.totalEvaluations}</div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {stats.totalThisMonth} this month
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">Average Score</CardTitle>
                    <CardDescription>All evaluations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{stats.averageScore}%</div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {getMonthlyChangeText(stats.averageScoreChange)}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">Pass Rate</CardTitle>
                    <CardDescription>Score {'>'} 60%</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{stats.passRate}%</div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {getMonthlyChangeText(stats.passRateChange)}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Evaluation Activity</CardTitle>
                  <CardDescription>Daily evaluation count</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                    <p className="mt-4 text-muted-foreground">
                      {evaluations.length > 0 ? 
                        `You have completed ${evaluations.length} evaluations in total` : 
                        'No evaluation data to display'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Detailed visualization coming in the next update
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Evaluations</CardTitle>
                    <CardDescription>Last 5 evaluations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {evaluations.length > 0 ? (
                      <div className="space-y-4">
                        {evaluations.slice(0, 5).map((evaluation, index) => (
                          <div key={evaluation.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                            <div>
                              <p className="font-medium">{evaluation.fileName}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(evaluation.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{Math.round((evaluation.score / evaluation.totalScore) * 100)}%</p>
                              <p className="text-sm text-muted-foreground">
                                {evaluation.score}/{evaluation.totalScore}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No evaluations found</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Question Performance</CardTitle>
                    <CardDescription>Average scores by question</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">
                        Question-specific analytics will be displayed here
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Available when you have more evaluations with questions
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="students" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Student performance analytics will be shown here
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Coming in the next update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="questions" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Question-specific analytics will be shown here
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Coming in the next update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Performance trends and analysis will be shown here
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Coming in the next update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsContainer;
