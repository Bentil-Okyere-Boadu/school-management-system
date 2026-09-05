import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { SchoolAdminSchoolGuard } from 'src/school-admin/guards/school-admin-school.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SkipTenantScope } from 'src/common/tenant/skip-tenant-scope.decorator';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  private schoolIdForAdmin(admin: SchoolAdmin, schoolId: string): string {
    const tokenSchoolId =
      (admin as SchoolAdmin & { schoolId?: string }).schoolId ??
      admin.school?.id;
    if (!tokenSchoolId || tokenSchoolId !== schoolId) {
      throw new ForbiddenException('School mismatch');
    }
    return tokenSchoolId;
  }

  @UseGuards(
    SchoolAdminJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    SchoolAdminSchoolGuard,
  )
  @Roles(Role.SchoolAdmin)
  @Post()
  create(
    @Body() dto: CreateNotificationDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    this.schoolIdForAdmin(admin, dto.schoolId);
    return this.notificationService.create(dto);
  }

  @UseGuards(
    SchoolAdminJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    SchoolAdminSchoolGuard,
  )
  @Roles(Role.SchoolAdmin)
  @SkipTenantScope()
  @Get('school/:id')
  findAllForSchoolAdmin(
    @Param('id') schoolId: string,
    @CurrentUser() admin: SchoolAdmin,
    @Query('search') search?: string,
  ) {
    return this.notificationService.findAllForSchool(
      this.schoolIdForAdmin(admin, schoolId),
      search,
    );
  }

  @UseGuards(
    SchoolAdminJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    SchoolAdminSchoolGuard,
  )
  @Roles(Role.SchoolAdmin)
  @SkipTenantScope()
  @Patch('school/:id/mark-all-read')
  markAllAsRead(
    @Param('id') schoolId: string,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.notificationService.markAllAsRead(
      this.schoolIdForAdmin(admin, schoolId),
    );
  }

  @UseGuards(
    SchoolAdminJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    SchoolAdminSchoolGuard,
  )
  @Roles(Role.SchoolAdmin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNotificationDto) {
    return this.notificationService.update(id, dto);
  }

  @UseGuards(
    SchoolAdminJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    SchoolAdminSchoolGuard,
  )
  @Roles(Role.SchoolAdmin)
  @Patch(':id/markAsRead')
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @UseGuards(
    SchoolAdminJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    SchoolAdminSchoolGuard,
  )
  @Roles(Role.SchoolAdmin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationService.remove(id);
  }
}
