// backend/src/role/role.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { RoleService } from './role.service';
import { Role } from './role.entity';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async findAll(): Promise<Role[]> {
    return this.roleService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Role | null> {
    return this.roleService.findById(id);
  }

  @Get('name/:name')
  async findByName(@Param('name') name: string): Promise<Role | null> {
    return this.roleService.findByName(name);
  }
}
