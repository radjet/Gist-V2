import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

const SettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <Link to="/" className="inline-block">
          <Button variant="ghost" size="sm" className="gap-2 pl-2">
            <ArrowLeft size={16} />
            Back to Map
          </Button>
        </Link>
        
        <div className="p-8 rounded-2xl border border-border bg-surface/50 text-center space-y-4 shadow-xl">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <p className="text-muted text-sm">
            Configuration options for data feeds and display preferences will appear here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;