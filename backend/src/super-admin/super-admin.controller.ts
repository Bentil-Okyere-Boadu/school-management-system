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
import { Roles } from 'src/auth/roles.decorator';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { QueryString } from 'src/common/api-features/api-features';
import { CurrentUser } from 'src/user/current-user.decorator';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';

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
  @Get('/admins/schools')
  @Roles('super_admin')
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
  @Roles('super_admin')
  async findAllArchivedUsers(@Query() query: QueryString) {
    return this.superAdminService.findAllArchivedUsers(query);
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('/admin/:id/archive')
  @Roles('super_admin')
  async archive(@Param('id') id: string, @Body() body: { archive: boolean }) {
    return this.superAdminService.archive(id, body.archive);
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('profile/me')
  @Roles('super_admin')
  async updateProfile(
    @CurrentUser() user: SuperAdmin,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.superAdminService.updateProfile(user.id, updateDto);
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('/me')
  @Roles('super_admin')
  async getMe(@CurrentUser() user: SuperAdmin) {
    return this.superAdminService.getMe(user);
  }
}
