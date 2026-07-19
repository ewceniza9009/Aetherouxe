import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@elite-realty/shared-ui/hooks';
import { RouterProvider } from '@tanstack/react-router';
import router from '@/router';
import { bootstrapSettings } from '@/lib/settings-store';
import { api } from '@elite-realty/shared-ui/lib/api';
import './pages/PropertiesPage';
import './pages/LeasesPage';
import './pages/RtoContractsPage';
import './pages/AnalyticsPage';
import './pages/DashboardPage';
import './pages/SettingsPage';
import './hooks/use-properties';
import './hooks/use-leases';
import './hooks/use-rto';
import './hooks/use-reports';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

import { ThemeProvider } from '@/components/ThemeProvider';

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <AuthProvider api={api as never} onBootstrapSettings={() => void bootstrapSettings()}>
            <RouterProvider router={router} />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
