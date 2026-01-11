import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import GlobePage from './src/app/GlobePage';
import SettingsPage from './src/app/SettingsPage';
import ClusterDrawer from './src/features/clusters/ClusterDrawer';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="relative w-full h-screen overflow-hidden bg-background text-text font-sans selection:bg-primary/30">
        <Routes>
          <Route path="/" element={<GlobePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        
        {/* Global Components */}
        <ClusterDrawer />
      </div>
    </HashRouter>
  );
};

export default App;