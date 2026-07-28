import { Suspense } from 'react';
import AppRoutes from '@/routes/AppRoutes';
import { useAuth } from '@/hooks/useAuth';
import { ToastViewport } from '@/components/ui/Toast';
import { LoadingPage } from '@/pages/LoadingPage';

function App() {
  const { initializing } = useAuth();

  if (initializing) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen transition-theme">
      <Suspense fallback={<LoadingPage />}>
        <AppRoutes />
      </Suspense>
      <ToastViewport />
    </div>
  );
}

export default App;
