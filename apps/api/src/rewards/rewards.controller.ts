import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { RedeemRewardDto } from './dto/rewards.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Get the catalog of available rewards' })
  getCatalog(@CurrentUser() user: { tenantId: string; id: string }) {
    return this.rewardsService.getCatalog(user.tenantId);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get current user reward points balance' })
  getBalance(@CurrentUser() user: { tenantId: string; id: string }) {
    return this.rewardsService.getBalance(user.tenantId, user.id);
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Get current user reward points ledger' })
  getLedger(@CurrentUser() user: { tenantId: string; id: string }) {
    return this.rewardsService.getLedger(user.tenantId, user.id);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem a reward using points' })
  redeem(@CurrentUser() user: { tenantId: string; id: string }, @Body() dto: RedeemRewardDto) {
    return this.rewardsService.redeem(user.tenantId, user.id, dto.rewardItemId);
  }
}
