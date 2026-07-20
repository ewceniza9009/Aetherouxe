import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyOwnerService } from './company-owner.service';

@Controller('company-owner')
@UseGuards(JwtAuthGuard)
export class CompanyOwnerController {
  constructor(private readonly service: CompanyOwnerService) {}

  @Get()
  async getCompanyOwner(@Request() req: { user: { tenantId: string } }) {
    const user = await this.service.getOrCreate(req.user.tenantId);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
