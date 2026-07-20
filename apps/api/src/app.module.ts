import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { BuildingsModule } from './buildings/buildings.module';
import { FloorsModule } from './floors/floors.module';
import { UnitsModule } from './units/units.module';
import { NumberingEngineModule } from './numbering-engine/numbering-engine.module';
import { MongodbModule } from './mongodb/mongodb.module';
import { ProjectsModule } from './projects/projects.module';
import { PhasesModule } from './phases/phases.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ContractorsModule } from './contractors/contractors.module';
import { ContractorEngagementsModule } from './contractor-engagements/contractor-engagements.module';
import { LeasesModule } from './leases/leases.module';
import { RentalPaymentsModule } from './rental-payments/rental-payments.module';
import { MortgageModule } from './mortgage/mortgage.module';
import { RtoModule } from './rto/rto.module';
import { AgentsModule } from './agents/agents.module';
import { CommissionsModule } from './commissions/commissions.module';
import { AgentTransactionsModule } from './agent-transactions/agent-transactions.module';
import { CommissionReleasesModule } from './commission-releases/commission-releases.module';
import { CommissionAgingModule } from './commission-aging/commission-aging.module';
import { PaymentRemindersModule } from './payment-reminders/payment-reminders.module';
import { StatementsModule } from './statements/statements.module';
import { CollectionActivitiesModule } from './collection-activities/collection-activities.module';
import { CollectionCasesModule } from './collection-cases/collection-cases.module';
import { ArAgingModule } from './ar-aging/ar-aging.module';
import { UtilityMetersModule } from './utility-meters/utility-meters.module';
import { ConsumptionReadingsModule } from './consumption-readings/consumption-readings.module';
import { UtilityBillsModule } from './utility-bills/utility-bills.module';
import { CommunityModule } from './community/community.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { LeadsModule } from './leads/leads.module';
import { DocumentsModule } from './documents/documents.module';
import { OwnerPnlModule } from './owner-pnl/owner-pnl.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';
import { SalesModule } from './sales/sales.module';
import { SchemesModule } from './schemes/schemes.module';
import { TitlesModule } from './titles/titles.module';
import { ImagesModule } from './images/images.module';
import { ReservationsModule } from './reservations/reservations.module';
import { CodeSequenceModule } from './code-sequence/code-sequence.module';
import { ApInvoicesModule } from './ap-invoices/ap-invoices.module';
import { GeneralLedgerModule } from './general-ledger/general-ledger.module';
import { OwnerPortalModule } from './owner-portal/owner-portal.module';
import { RolesModule } from './roles/roles.module';
import { CompanyOwnerModule } from './company-owner/company-owner.module';
import { LedgerModule } from './ledger/ledger.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PropertiesModule,
    BuildingsModule,
    FloorsModule,
    UnitsModule,
    NumberingEngineModule,
    ProjectsModule,
    PhasesModule,
    BudgetsModule,
    ContractorsModule,
    ContractorEngagementsModule,
    LeasesModule,
    RentalPaymentsModule,
    MortgageModule,
    RtoModule,
    AgentsModule,
    CommissionsModule,
    AgentTransactionsModule,
    CommissionReleasesModule,
    CommissionAgingModule,
    PaymentRemindersModule,
    StatementsModule,
    CollectionActivitiesModule,
    CollectionCasesModule,
    ArAgingModule,
    UtilityMetersModule,
    ConsumptionReadingsModule,
    UtilityBillsModule,
    CommunityModule,
    ServiceRequestsModule,
    LeadsModule,
    DocumentsModule,
    OwnerPnlModule,
    ReportsModule,
    NotificationsModule,
    SettingsModule,
    UsersModule,
    SalesModule,
    SchemesModule,
    TitlesModule,
    ImagesModule,
    ReservationsModule,
    CodeSequenceModule,
    ...(process.env.MONGODB_URI ? [MongodbModule] : []),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    ApInvoicesModule,
    GeneralLedgerModule,
    OwnerPortalModule,
    RolesModule,
    CompanyOwnerModule,
    LedgerModule,
    SearchModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
