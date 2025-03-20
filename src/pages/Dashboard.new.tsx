import React from 'react';
import Navbar from '@/components/Navbar';
import { DashboardProvider } from '@/components/dashboard/DashboardContext';
import DashboardContainer from '@/components/dashboard/DashboardContainer';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <DashboardProvider>
        <DashboardContainer />
      </DashboardProvider>
    </div>
  );
};

export default Dashboard;
