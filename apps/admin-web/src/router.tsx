import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import NewPropertyPage from "./pages/NewPropertyPage";
import EditPropertyPage from "./pages/EditPropertyPage";
import UnitListPage from "./pages/UnitListPage";
import NewUnitPage from "./pages/NewUnitPage";
import EditUnitPage from "./pages/EditUnitPage";
import BuildingsPage from "./pages/BuildingsPage";
import NewBuildingPage from "./pages/NewBuildingPage";
import EditBuildingPage from "./pages/EditBuildingPage";
import FloorListPage from "./pages/FloorListPage";
import TenantsPage from "./pages/TenantsPage";
import LeasesPage from "./pages/LeasesPage";
import LeaseDetailPage from "./pages/LeaseDetailPage";
import NewLeasePage from "./pages/NewLeasePage";
import EditLeasePage from "./pages/EditLeasePage";
import MortgageScenarioPage from "./pages/MortgageScenarioPage";
import RtoContractsPage from "./pages/RtoContractsPage";
import RtoContractDetailPage from "./pages/RtoContractDetailPage";
import ProjectsPage from "./pages/ProjectsPage";
import NewProjectPage from "./pages/NewProjectPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import EditProjectPage from "./pages/EditProjectPage";
import BudgetDetailPage from "./pages/BudgetDetailPage";
import ContractorsPage from "./pages/ContractorsPage";
import ContractorDetailPage from "./pages/ContractorDetailPage";
import AgentsPage from "./pages/AgentsPage";
import AgentDetailPage from "./pages/AgentDetailPage";
import NewAgentPage from "./pages/NewAgentPage";
import EditAgentPage from "./pages/EditAgentPage";
import CommissionsPage from "./pages/CommissionsPage";
import CommissionAgingPage from "./pages/CommissionAgingPage";
import FinancePage from "./pages/FinancePage";
import SettingsPage from "./pages/SettingsPage";
import CollectionsPage from "./pages/CollectionsPage";
import ArAgingPage from "./pages/ArAgingPage";
import StatementsPage from "./pages/StatementsPage";
import CollectionCasesPage from "./pages/CollectionCasesPage";
import CollectionCaseDetailPage from "./pages/CollectionCaseDetailPage";
import PaymentRemindersPage from "./pages/PaymentRemindersPage";
import MetersPage from "./pages/MetersPage";
import MeterDetailPage from "./pages/MeterDetailPage";
import ReadingsPage from "./pages/ReadingsPage";
import UtilityBillsPage from "./pages/UtilityBillsPage";
import AmenitiesPage from "./pages/AmenitiesPage";
import AmenityDetailPage from "./pages/AmenityDetailPage";
import CommunityPostsPage from "./pages/CommunityPostsPage";
import ServiceRequestsPage from "./pages/ServiceRequestsPage";
import ServiceRequestDetailPage from "./pages/ServiceRequestDetailPage";
import DocumentsPage from "./pages/DocumentsPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import OwnerPnlPage from "./pages/OwnerPnlPage";
import PnlDetailPage from "./pages/PnlDetailPage";
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
    if (!token) {
      return <LoginPage />;
    }
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
  component: DashboardPage,
});

const propertiesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/properties",
  component: PropertiesPage,
});

const propertyDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/properties/$id",
  component: PropertyDetailPage,
});

const newPropertyRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/properties/new",
  component: NewPropertyPage,
});

const editPropertyRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/properties/$propertyId/edit",
  component: EditPropertyPage,
});

const unitListRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/properties/$propertyId/units",
  component: UnitListPage,
});

const newUnitRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/properties/$propertyId/units/new",
  component: NewUnitPage,
});

const editUnitRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/properties/$propertyId/units/$unitId/edit",
  component: EditUnitPage,
});

const buildingsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/buildings",
  component: BuildingsPage,
});

const newBuildingRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/buildings/new",
  component: NewBuildingPage,
});

const editBuildingRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/buildings/$buildingId/edit",
  component: EditBuildingPage,
});

const floorListRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/buildings/$buildingId/floors",
  component: FloorListPage,
});

const tenantsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/tenants",
  component: TenantsPage,
});

const leasesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/leases",
  component: LeasesPage,
});

const newLeaseRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/leases/new",
  component: NewLeasePage,
});

const editLeaseRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/leases/$id/edit",
  component: EditLeasePage,
});

const leaseDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/leases/$id",
  component: LeaseDetailPage,
});

const leaseMortgageRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/leases/$leaseId/mortgage/$scenarioId",
  component: MortgageScenarioPage,
});

const rtoContractsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/rto",
  component: RtoContractsPage,
});

const rtoContractDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/rto/$id",
  component: RtoContractDetailPage,
});

const projectsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/projects",
  component: ProjectsPage,
});

const newProjectRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/projects/new",
  component: NewProjectPage,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/projects/$id",
  component: ProjectDetailPage,
});

const editProjectRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/projects/$projectId/edit",
  component: EditProjectPage,
});

const budgetDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/projects/$projectId/budgets/$budgetId",
  component: BudgetDetailPage,
});

const contractorsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/contractors",
  component: ContractorsPage,
});

const contractorDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/contractors/$id",
  component: ContractorDetailPage,
});

const agentsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/agents",
  component: AgentsPage,
});

const newAgentRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/agents/new",
  component: NewAgentPage,
});

const editAgentRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/agents/$id/edit",
  component: EditAgentPage,
});

const agentDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/agents/$id",
  component: AgentDetailPage,
});

const commissionsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/commissions",
  component: CommissionsPage,
});

const commissionAgingRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/finance/commission-aging",
  component: CommissionAgingPage,
});

const financeRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/finance",
  component: FinancePage,
});

const settingsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/settings",
  component: SettingsPage,
});

const collectionsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/collections",
  component: CollectionsPage,
});

const arAgingRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/collections/ar-aging",
  component: ArAgingPage,
});

const statementsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/statements",
  component: StatementsPage,
});

const collectionCasesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/collections/cases",
  component: CollectionCasesPage,
});

const collectionCaseDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/collections/cases/$id",
  component: CollectionCaseDetailPage,
});

const paymentRemindersRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/payment-reminders",
  component: PaymentRemindersPage,
});

const metersRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/meters",
  component: MetersPage,
});

const meterDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/meters/$id",
  component: MeterDetailPage,
});

const readingsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/readings",
  component: ReadingsPage,
});

const utilityBillsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/utility-bills",
  component: UtilityBillsPage,
});

const amenitiesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/amenities",
  component: AmenitiesPage,
});

const amenityDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/amenities/$id",
  component: AmenityDetailPage,
});

const communityPostsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/community-posts",
  component: CommunityPostsPage,
});

const serviceRequestsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/service-requests",
  component: ServiceRequestsPage,
});

const serviceRequestDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/service-requests/$id",
  component: ServiceRequestDetailPage,
});

const documentsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/documents",
  component: DocumentsPage,
});

const documentDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/documents/$id",
  component: DocumentDetailPage,
});

const ownerPnlRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/owner-pnl",
  component: OwnerPnlPage,
});

const pnlDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/owner-pnl/$id",
  component: PnlDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  protectedLayout.addChildren([
    dashboardRoute,
    propertiesRoute,
    propertyDetailRoute,
    newPropertyRoute,
    editPropertyRoute,
    unitListRoute,
    newUnitRoute,
    editUnitRoute,
    buildingsRoute,
    newBuildingRoute,
    editBuildingRoute,
    floorListRoute,
    tenantsRoute,
    leasesRoute,
    newLeaseRoute,
    editLeaseRoute,
    leaseDetailRoute,
    leaseMortgageRoute,
    rtoContractsRoute,
    rtoContractDetailRoute,
    projectsRoute,
    newProjectRoute,
    projectDetailRoute,
    editProjectRoute,
    budgetDetailRoute,
    contractorsRoute,
    contractorDetailRoute,
    agentsRoute,
    newAgentRoute,
    editAgentRoute,
    agentDetailRoute,
    commissionsRoute,
    commissionAgingRoute,
    financeRoute,
    settingsRoute,
    collectionsRoute,
    arAgingRoute,
    statementsRoute,
    collectionCasesRoute,
    collectionCaseDetailRoute,
    paymentRemindersRoute,
    metersRoute,
    meterDetailRoute,
    readingsRoute,
    utilityBillsRoute,
    amenitiesRoute,
    amenityDetailRoute,
    communityPostsRoute,
    serviceRequestsRoute,
    serviceRequestDetailRoute,
    documentsRoute,
    documentDetailRoute,
    ownerPnlRoute,
    pnlDetailRoute,
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
