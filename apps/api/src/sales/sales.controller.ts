import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SalesService } from './sales.service';
import { ApplySchemeDto } from './dto/apply-scheme.dto';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('apply-scheme')
  async applyScheme(@Body() dto: ApplySchemeDto, @Request() req: any) {
    const userId = req?.user?.id;
    return this.salesService.applyScheme(dto, userId);
  }
}
