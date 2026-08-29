import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { SuperAdmin } from './super-admin.entity';
import { SuperAdminJwtAuthGuard } from './guards/super-admin-jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { QueryString } from 'src/common/api-features/api-features';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { TenantOnboardingService } from 'src/tenant/tenant-onboarding.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateSchoolDto } from 'src/school/dto/create-school.dto';

@ApiTags('Super Admin')
@Controller('super-admin')
export class SuperAdminController {
  constructor(
    private readonly superAdminService: SuperAdminService,
    private readonly tenantOnboarding: TenantOnboardingService,
  ) {}

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('/schools')
  @Roles(Role.SuperAdmin)
  createSchool(@Body() dto: CreateSchoolDto) {
    return this.tenantOnboarding.createAndProvisionSchool(dto);
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('/schools/:id/provision')
  @Roles(Role.SuperAdmin)
  retryProvision(@Param('id') id: string) {
    return this.tenantOnboarding.retryProvision(id);
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('/schools/:id/disabled')
  @Roles(Role.SuperAdmin)
  setDisabled(
    @Param('id') id: string,
    @Body() body: { disabled: boolean },
  ) {
    return this.tenantOnboarding.setDisabled(id, body.disabled);
  }

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
  @Put('/admin/:id/suspend')
  @Roles(Role.SuperAdmin)
  async suspendSchoolAdmin(
    @Param('id') id: string,
    @Body() body: { suspend: boolean },
  ) {
    return this.superAdminService.suspendSchoolAdmin(id, body.suspend);
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
