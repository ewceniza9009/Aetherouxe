import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto, @Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.rolesService.create(createRoleDto, tenantId);
  }

  @Get()
  findAll(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.rolesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.rolesService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto, @Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.rolesService.update(id, updateRoleDto, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.rolesService.remove(id, tenantId);
  }
}
