import {
  Controller,
  Get,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { UpdateSuperAdminDto } from './dto/update-super-admin.dto';
import { SuperAdmin } from './super-admin.entity';
import { SuperAdminJwtAuthGuard } from './guards/super-admin-jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { QueryString } from 'src/common/api-features/api-features';

@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('/admins')
  @Roles('super_admin')
  async findAllAdminUsers(@Query() query: QueryString) {
    return this.superAdminService.findAllUsers(query);
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('/admin/:id')
  async findOne(@Param('id') id: string): Promise<SuperAdmin> {
    return this.superAdminService.findOne(id);
  }

  //TODO: ADD endpoints
  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSuperAdminDto: UpdateSuperAdminDto,
  ): Promise<SuperAdmin> {
    return this.superAdminService.update(id, updateSuperAdminDto);
  }

  //TODO: ADD endpoints
  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.superAdminService.remove(id);
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('/admin/:id/archive')
  async archive(
    @Param('id') id: string,
    @Body() body: { archive: boolean },
  ): Promise<SuperAdmin> {
    return this.superAdminService.archive(id, body.archive);
  }
}
