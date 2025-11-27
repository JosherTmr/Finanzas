import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import MonthDetail from './components/MonthDetail';
import Home from './components/Home';
import LoginPage from './components/LoginPage';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background text-textMain font-sans selection:bg-primary selection:text-white">
      <main className="max-w-md mx-auto w-full min-h-screen relative shadow-2xl shadow-black">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Home />} />
          <Route path="/mes/:year/:month" element={<MonthDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <FinanceProvider>
        <MainLayout />
      </FinanceProvider>
    </BrowserRouter>
  );
};

export default App;