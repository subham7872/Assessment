import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import useAuthStore from './store/authStore';

const App = () => {
  const refreshSession = useAuthStore((state) => state.refreshSession);

  useEffect(() => {
    refreshSession();
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '8px',
          },
        }}
      />
    </BrowserRouter>
  );
};

export default App;
