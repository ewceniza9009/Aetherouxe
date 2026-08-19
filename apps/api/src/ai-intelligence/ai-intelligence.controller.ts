import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserType } from '@prisma/client';
import { RtoCreditScoreService, RtoCreditScoreReport } from './rto-credit-score.service';

@ApiTags('AI Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiIntelligenceController {
  constructor(private readonly rtoCreditService: RtoCreditScoreService) {}

  @Get('rto-score/:rtoContractId')
  @Roles(
    UserType.super_admin,
    UserType.admin,
    UserType.property_manager,
    UserType.finance,
    UserType.owner,
    UserType.tenant,
  )
  @ApiOperation({ summary: 'Calculate AI RTO Credit Score & Conversion Readiness Index' })
  @ApiResponse({ status: 200, description: 'RTO credit score report generated' })
  async getRtoScore(@Param('rtoContractId') rtoContractId: string): Promise<RtoCreditScoreReport> {
    return this.rtoCreditService.calculateRtoScore(rtoContractId);
  }
}
