import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';

// 9 Core BRACE Modules
import CommandCenter from './pages/CommandCenter';
import NetworkLab from './pages/NetworkLab';
import ThreatIntelligence from './pages/ThreatIntelligence';
import AttackReconstruction from './pages/AttackReconstruction';
import Optimization from './pages/Optimization';
import AlgorithmStudio from './pages/AlgorithmStudio';
import AlgorithmArena from './pages/AlgorithmArena';
import PerformanceLab from './pages/PerformanceLab';
import Reports from './pages/Reports';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<CommandCenter />} />
          <Route path="network-lab" element={<NetworkLab />} />
          <Route path="threat-intel" element={<ThreatIntelligence />} />
          <Route path="attack-reconstruction" element={<AttackReconstruction />} />
          <Route path="optimization" element={<Optimization />} />
          <Route path="algorithm-studio" element={<AlgorithmStudio />} />
          <Route path="algorithm-arena" element={<AlgorithmArena />} />
          <Route path="performance-lab" element={<PerformanceLab />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
