import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { RouterProvider } from "@tanstack/react-router";
import router from "@/router";
import "./pages/PropertiesPage";
import "./pages/LeasesPage";
import "./pages/RtoContractsPage";
import "./pages/AnalyticsPage";
import "./pages/DashboardPage";
import "./pages/SettingsPage";
import "./hooks/use-properties";
import "./hooks/use-leases";
import "./hooks/use-rto";
import "./hooks/use-reports";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}
