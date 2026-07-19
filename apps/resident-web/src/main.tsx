import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@elite-realty/shared-ui/hooks';
import { api } from '@elite-realty/shared-ui/lib/api';
import { RouterProvider } from '@tanstack/react-router';
import router from '@/router';
import { registerServiceWorker } from '@/pwa';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider api={api} onBootstrapSettings={() => {}}>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

if (import.meta.env.PROD) {
  registerServiceWorker();
}
