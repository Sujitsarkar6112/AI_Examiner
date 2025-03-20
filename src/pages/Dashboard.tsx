import React, { useState } from 'react';
import SideNavigation from '@/components/SideNavigation';
import { DashboardProvider } from '@/components/dashboard/DashboardContext';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import SettingsContainer from '@/components/settings/SettingsContainer';
import QuestionPapersContainer from '@/components/question-papers/QuestionPapersContainer';
import HeaderBar from '@/components/ui/HeaderBar';
import EvaluationHistory from '@/components/evaluation-history';
import AnalyticsContainer from '@/components/analytics';
import UploadEvaluateContainer from '@/components/upload-evaluate';
import { ExtractedTextsContainer } from '@/components/extracted-texts/ExtractedTextsContainer';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardProvider>
            <DashboardContainer />
          </DashboardProvider>
        );
      case 'upload':
        return (
          <DashboardProvider>
            <div className="max-w-6xl mx-auto w-full">
              <UploadEvaluateContainer />
            </div>
          </DashboardProvider>
        );
      case 'question-papers':
        return <QuestionPapersContainer />;
      case 'extracted-texts':
        return <ExtractedTextsContainer />;
      case 'evaluation-history':
        return <EvaluationHistory />;
      case 'analytics':
        return <AnalyticsContainer />;
      case 'settings':
        return <SettingsContainer />;
      default:
        return (
          <DashboardProvider>
            <DashboardContainer />
          </DashboardProvider>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <SideNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <HeaderBar userName="John Doe" />
        <main className="flex-1 overflow-y-auto p-6">
          {renderActiveContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
