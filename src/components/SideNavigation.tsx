import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Clock,
  FileText,
  Home,
  Settings,
  Upload,
  Copy,
  FileSearch
} from 'lucide-react';

interface SideNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const SideNavigation: React.FC<SideNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
    },
    {
      id: 'upload',
      label: 'Upload & Evaluate',
      icon: <Upload className="h-5 w-5" />,
    },
    {
      id: 'question-papers',
      label: 'Question Papers',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 'extracted-texts',
      label: 'Extracted Texts',
      icon: <FileSearch className="h-5 w-5" />,
    },
    {
      id: 'evaluation-history',
      label: 'Evaluation History',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="w-64 h-full bg-background border-r">
      <div className="flex items-center p-4 border-b">
        <div className="flex items-center space-x-2">
          <Copy className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">AnswerEval</span>
        </div>
      </div>
      <div className="p-3">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors',
                activeTab === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default SideNavigation;
