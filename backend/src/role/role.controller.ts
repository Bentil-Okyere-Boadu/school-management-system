// backend/src/role/role.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { Role } from './role.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async findAll(): Promise<Role[]> {
    return this.roleService.findAll();
  }
  @UseGuards(JwtAuthGuard, ActiveUserGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Role | null> {
    return this.roleService.findById(id);
  }
  @UseGuards(JwtAuthGuard, ActiveUserGuard)
  @Get('name/:name')
  async findByName(@Param('name') name: string): Promise<Role | null> {
    return this.roleService.findByName(name);
  }
}
