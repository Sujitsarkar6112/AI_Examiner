
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  BookOpen, 
  Upload, 
  PenTool, 
  CheckCircle,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

const Index: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const features = [
    {
      title: 'Intelligent Document Processing',
      description: 'Upload scanned answer sheets, digital PDFs, or images for instant processing using advanced OCR technology.',
      icon: <Upload className="h-5 w-5 text-primary" />
    },
    {
      title: 'LLM-Powered Evaluation',
      description: 'Our AI evaluates answers based on key concepts, accuracy, completeness, and relevance to provide fair assessments.',
      icon: <PenTool className="h-5 w-5 text-primary" />
    },
    {
      title: 'Comprehensive Feedback',
      description: 'Get detailed insights on strengths and areas for improvement with specific suggestions for each answer.',
      icon: <CheckCircle className="h-5 w-5 text-primary" />
    },
    {
      title: 'Educational Focus',
      description: 'Designed for educators and students to provide constructive feedback that encourages learning and growth.',
      icon: <BookOpen className="h-5 w-5 text-primary" />
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center animate-slide-down">
            <div className="inline-block">
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                Automated Answer Sheet Evaluation
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Evaluate Answer Sheets with AI Precision
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Upload answer sheets and get instant, objective evaluations with detailed feedback powered by advanced AI technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate(user ? '/dashboard' : '/auth')}
                className="btn-primary px-8 py-3 text-lg flex items-center justify-center gap-2"
              >
                <span>{user ? 'Go to Dashboard' : 'Get Started'}</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              {!user && (
                <button 
                  onClick={() => navigate('/auth')}
                  className="btn-outline px-8 py-3 text-lg"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Image/Preview Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden animate-fade-in">
            <div className="aspect-video w-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
              <div className="max-w-2xl w-full mx-4 glass rounded-xl p-4 shadow-lg border border-white/20">
                <div className="mb-4">
                  <div className="h-8 w-32 bg-primary/20 rounded-md animate-pulse-soft"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-primary/10 rounded-md w-full animate-pulse-soft"></div>
                  <div className="h-4 bg-primary/10 rounded-md w-5/6 animate-pulse-soft"></div>
                  <div className="h-4 bg-primary/10 rounded-md w-4/6 animate-pulse-soft"></div>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="h-8 w-24 bg-primary rounded-md animate-pulse-soft"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16 animate-slide-up">
            <div className="inline-block">
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                Key Features
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Streamlined Evaluation Process
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform combines advanced OCR with AI-powered analysis to provide comprehensive, objective assessments of answer sheets.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="p-6 rounded-xl border bg-card hover:shadow-md transition-all group"
              >
                <div className="p-2 bg-primary/10 rounded-md w-fit mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-b from-secondary/30 to-secondary/10">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-card rounded-2xl border shadow-sm p-8 md:p-12 text-center animate-fade-in">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Streamline Your Evaluation Process?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Join educators and institutions already using our platform to provide faster, more consistent feedback to students.
            </p>
            <button 
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
              className="btn-primary px-8 py-3 text-lg flex items-center gap-2 mx-auto"
            >
              <span>{user ? 'Go to Dashboard' : 'Get Started Now'}</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold">A</span>
              </div>
              <span className="font-semibold">AnswerEval</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AnswerEval. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
