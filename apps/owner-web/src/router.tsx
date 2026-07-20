import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import { OwnerLoginPage } from './pages/OwnerLoginPage';
import OwnerDashboardPage from './pages/DashboardPage';
import OwnerPropertiesPage from './pages/PropertiesPage';
import OwnerProjectsPage from './pages/ProjectsPage';
import OwnerProjectDetailPage from './pages/ProjectDetailPage';
import OwnerBudgetHealthPage from './pages/BudgetHealthPage';
import FinancialsPage from './pages/FinancialsPage';
import DocumentsPage from './pages/DocumentsPage';
import PnlPage from './pages/PnlPage';
import DashboardLayout from './components/layout/DashboardLayout';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => <OwnerLoginPage portalName="Owner" />,
});

const protectedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: '__protected',
  component: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return <OwnerLoginPage portalName="Owner" />;
    return (
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    );
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/dashboard',
  component: OwnerDashboardPage,
});

const propertiesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/properties',
  component: OwnerPropertiesPage,
});

const projectsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/projects',
  component: OwnerProjectsPage,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/projects/$projectId',
  component: OwnerProjectDetailPage,
});

const budgetHealthRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/projects/$projectId/budgets/$budgetId',
  component: OwnerBudgetHealthPage,
});

const financialsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/financials',
  component: FinancialsPage,
});

const pnlRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/pnl',
  component: PnlPage,
});

const documentsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/documents',
  component: DocumentsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  protectedLayout.addChildren([
    dashboardRoute,
    propertiesRoute,
    projectsRoute,
    projectDetailRoute,
    budgetHealthRoute,
    financialsRoute,
    pnlRoute,
    documentsRoute,
  ]),
]);

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default router;
