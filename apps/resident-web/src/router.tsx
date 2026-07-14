import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import LoginPage from "./pages/LoginPage";
import ResidentDashboardPage from "./pages/DashboardPage";
import PaymentsPage from "./pages/PaymentsPage";
import LeasePage from "./pages/LeasePage";
import RtoPage from "./pages/RtoPage";
import MortgageScenarioPage from "./pages/MortgageScenarioPage";
import AmenitiesPage from "./pages/AmenitiesPage";
import ServiceRequestsPage from "./pages/ServiceRequestsPage";
import CommunityPage from "./pages/CommunityPage";
import ResidentDocumentsPage from "./pages/DocumentsPage";
import DashboardLayout from "./components/layout/DashboardLayout";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const protectedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return <LoginPage />;
    return (
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    );
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/dashboard",
  component: ResidentDashboardPage,
});

const paymentsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/payments",
  component: PaymentsPage,
});

const leaseRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/lease",
  component: LeasePage,
});

const leaseMortgageRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/lease/mortgage/$scenarioId",
  component: MortgageScenarioPage,
});

const rtoRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/rto",
  component: RtoPage,
});

const amenitiesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/amenities",
  component: AmenitiesPage,
});

const serviceRequestsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/service-requests",
  component: ServiceRequestsPage,
});

const communityRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/community",
  component: CommunityPage,
});

const documentsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/documents",
  component: ResidentDocumentsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  protectedLayout.addChildren([
    dashboardRoute,
    paymentsRoute,
    leaseRoute,
    leaseMortgageRoute,
    rtoRoute,
    amenitiesRoute,
    serviceRequestsRoute,
    communityRoute,
    documentsRoute,
  ]),
]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default router;
