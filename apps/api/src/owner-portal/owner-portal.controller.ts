import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { OwnerPortalService } from './owner-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('owner-portal')
@UseGuards(JwtAuthGuard)
export class OwnerPortalController {
  constructor(private readonly ownerPortalService: OwnerPortalService) {}

  @Get('portfolio-stats')
  getPortfolioStats(@Request() req: any) {
    return this.ownerPortalService.getPortfolioStats(req.user.id);
  }

  @Get('properties')
  getMyProperties(@Request() req: any) {
    return this.ownerPortalService.getMyProperties(req.user.id);
  }

  @Get('financials')
  getMyFinancials(@Request() req: any) {
    return this.ownerPortalService.getMyFinancials(req.user.id);
  }
}
