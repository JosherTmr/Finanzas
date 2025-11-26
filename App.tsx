import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import MonthDetail from './components/MonthDetail';
import Home from './components/Home';

const MainLayout = () => {
  const { setSelectedMonth } = useFinance();
  // Simple view router: 'home' | 'detail'
  const [currentView, setCurrentView] = useState<'home' | 'detail'>('home');

  const handleSelectMonth = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    setCurrentView('detail');
  };

  const handleBack = () => {
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-background text-textMain font-sans selection:bg-primary selection:text-white">
      <main className="max-w-md mx-auto w-full min-h-screen relative shadow-2xl shadow-black">
        {currentView === 'home' ? (
          <Home onSelectMonth={handleSelectMonth} />
        ) : (
          <MonthDetail onBack={handleBack} />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <FinanceProvider>
      <MainLayout />
    </FinanceProvider>
  );
};

export default App;