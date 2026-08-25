import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Login } from './pages/Login';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Learning } from './pages/Learning';
import { CategoryDetail } from './pages/CategoryDetail';
import { Tasks } from './pages/Tasks';
import { Fitness } from './pages/Fitness';
import { Finance } from './pages/Finance';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { BookOpen } from 'lucide-react';

// Protected Route Wrapper
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0B0F19] text-gray-400 select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center animate-bounce shadow-lg shadow-indigo-500/20">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-slate-500 animate-pulse">
            Loading System
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Authenticated Application routes */}
            <Route 
              path="/" 
              element={
                <AuthRoute>
                  <AppShell />
                </AuthRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="learning" element={<Learning />} />
              <Route path="learning/:categoryId" element={<CategoryDetail />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="fitness" element={<Fitness />} />
              <Route path="finance" element={<Finance />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              
              {/* Fallback to index for other paths */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
