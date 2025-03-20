import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getSavedEvaluations, EvaluationResult } from '@/services/evaluation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileSpreadsheet, Award, Users, TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPapers: 0,
    highestMarks: 0,
    studentsPassed: 0,
    averageScore: 0,
  });
  const [scoreDistribution, setScoreDistribution] = useState<any[]>([]);
  const [resultsByQuestion, setResultsByQuestion] = useState<any[]>([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Parse markdown content to extract scores
  const extractScores = (markdownContent: string) => {
    try {
      // Extract total score
      const totalScoreMatch = markdownContent.match(/Total Score:\s*(\d+(\.\d+)?)/i);
      const totalScore = totalScoreMatch ? parseFloat(totalScoreMatch[1]) : 0;
      
      // Count if passed (assuming passing is 40% or more)
      const isPassed = totalScore >= 40;

      // Extract per-question scores
      const questionMatches = Array.from(markdownContent.matchAll(/Question\s+(\d+)[\s\S]*?Score:\s*(\d+(\.\d+)?)/gi));
      const questionScores = questionMatches.map(match => ({
        question: `Q${match[1]}`,
        score: parseFloat(match[2])
      }));

      return {
        totalScore,
        isPassed,
        questionScores
      };
    } catch (e) {
      console.error("Error extracting scores:", e);
      return { totalScore: 0, isPassed: false, questionScores: [] };
    }
  };

  useEffect(() => {
    const loadEvaluations = async () => {
      setLoading(true);
      try {
        const results = await getSavedEvaluations();
        setEvaluations(results);
        
        // Extract analytics data
        let highestMarks = 0;
        let passedCount = 0;
        let totalScoreSum = 0;
        
        // For distribution chart
        const scoreRanges = [
          { name: '0-20%', count: 0 },
          { name: '21-40%', count: 0 },
          { name: '41-60%', count: 0 },
          { name: '61-80%', count: 0 },
          { name: '81-100%', count: 0 }
        ];
        
        // For question-wise results
        const questionResults: Record<string, { total: number, count: number }> = {};
        
        // Process each evaluation
        results.forEach(evaluation => {
          const { totalScore, isPassed, questionScores } = extractScores(evaluation.markdownContent);
          
          // Update highest marks
          if (totalScore > highestMarks) {
            highestMarks = totalScore;
          }
          
          // Count passed students
          if (isPassed) {
            passedCount++;
          }
          
          // Add to total for average calculation
          totalScoreSum += totalScore;
          
          // Update score distribution
          if (totalScore <= 20) scoreRanges[0].count++;
          else if (totalScore <= 40) scoreRanges[1].count++;
          else if (totalScore <= 60) scoreRanges[2].count++;
          else if (totalScore <= 80) scoreRanges[3].count++;
          else scoreRanges[4].count++;
          
          // Process question-wise results
          questionScores.forEach(({ question, score }) => {
            if (!questionResults[question]) {
              questionResults[question] = { total: 0, count: 0 };
            }
            questionResults[question].total += score;
            questionResults[question].count++;
          });
        });
        
        // Calculate average
        const averageScore = results.length > 0 ? totalScoreSum / results.length : 0;
        
        // Set statistics
        setStats({
          totalPapers: results.length,
          highestMarks,
          studentsPassed: passedCount,
          averageScore
        });
        
        // Set score distribution for chart
        setScoreDistribution(scoreRanges);
        
        // Calculate average score by question
        const questionData = Object.entries(questionResults).map(([question, data]) => ({
          name: question,
          averageScore: data.count > 0 ? data.total / data.count : 0
        }));
        
        setResultsByQuestion(questionData);
      } catch (error) {
        console.error("Error loading evaluations for analytics:", error);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    loadEvaluations();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-destructive">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 space-y-4 p-8 pt-24">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Evaluation Analytics</h2>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Papers Evaluated</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPapers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Marks</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highestMarks.toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Passed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.studentsPassed}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPapers > 0
                  ? `${((stats.studentsPassed / stats.totalPapers) * 100).toFixed(1)}% pass rate`
                  : "No data available"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>Distribution of scores across all evaluations</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Average Score by Question</CardTitle>
              <CardDescription>Performance analysis per question</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={resultsByQuestion}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="averageScore" fill="#8884d8" name="Average Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Evaluations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Evaluations</CardTitle>
            <CardDescription>Latest paper evaluations</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {evaluations.length === 0 ? (
                  <p className="text-center text-muted-foreground">No evaluations found</p>
                ) : (
                  evaluations.map((evaluation) => {
                    const { totalScore } = extractScores(evaluation.markdownContent);
                    return (
                      <div key={evaluation.id} className="flex items-center justify-between border-b pb-4">
                        <div>
                          <p className="font-medium">{evaluation.fileName}</p>
                          <p className="text-sm text-muted-foreground">{new Date(evaluation.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center">
                          <p className={`font-bold ${totalScore >= 40 ? 'text-green-500' : 'text-red-500'}`}>
                            {totalScore.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;
