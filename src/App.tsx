import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/app/DashboardPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* 1. One Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Login Page */}
      <Route path="/login" element={<LoginPage />} />

      {/* 3. Only One Unified Dashboard With All Features */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
