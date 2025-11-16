import {
  Controller,
  Get,
  Body,
  Param,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdmin } from './super-admin.entity';
import { SuperAdminJwtAuthGuard } from './guards/super-admin-jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { QueryString } from 'src/common/api-features/api-features';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('/admins')
  @Roles(Role.SuperAdmin)
  async findAllAdminUsers(@Query() query: QueryString) {
    return this.superAdminService.findAllUsers(query);
  }
  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('/admins/schools')
  @Roles(Role.SuperAdmin)
  async findAllSchool(@Query() query: QueryString) {
    return this.superAdminService.findAllSchools(query);
  }
  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('/admin/:id')
  async findOne(@Param('id') id: string) {
    return this.superAdminService.findOne(id);
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('/admins/archived')
  @Roles(Role.SuperAdmin)
  async findAllArchivedUsers(@Query() query: QueryString) {
    return this.superAdminService.findAllArchivedUsers(query);
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('/admin/:id/archive')
  @Roles(Role.SuperAdmin)
  async archive(@Param('id') id: string, @Body() body: { archive: boolean }) {
    return this.superAdminService.archive(id, body.archive);
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('profile/me')
  @Roles(Role.SuperAdmin)
  async updateProfile(
    @CurrentUser() user: SuperAdmin,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.superAdminService.updateProfile(user.id, updateDto);
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('/me')
  @Roles(Role.SuperAdmin)
  async getMe(@CurrentUser() user: SuperAdmin) {
    return this.superAdminService.getMe(user);
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('/dashboard/schools-performance')
  @Roles(Role.SuperAdmin)
  getSchoolsPerformance(
    @Query('topThreshold') topThreshold?: string,
    @Query('lowThreshold') lowThreshold?: string,
    @Query('scope') scope?: 'range' | 'overall',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const tt = topThreshold ? parseFloat(topThreshold) : undefined;
    const lt = lowThreshold ? parseFloat(lowThreshold) : undefined;
    return this.superAdminService.getSchoolsPerformance({
      topThreshold: tt,
      lowThreshold: lt,
      scope,
      from,
      to,
    });
  }
}
