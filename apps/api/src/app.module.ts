import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
    ...(process.env.MONGODB_URI ? [MongodbModule] : []),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
