import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { StudentAnalyticsService } from './student-analytics.service';

@ApiTags('School Admin — Student analytics')
@Controller('school-admin/students')
export class StudentAnalyticsAdminController {
  constructor(
    private readonly studentAnalyticsService: StudentAnalyticsService,
  ) {}

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(':studentId/performance-analytics')
  @Roles(Role.SchoolAdmin)
  async getPerformanceAnalytics(
    @Param('studentId') studentId: string,
    @Query('academicTermId') academicTermId: string,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    if (!academicTermId?.trim()) {
      throw new BadRequestException('academicTermId is required');
    }
    return this.studentAnalyticsService.getPerformanceAnalyticsForSchoolAdmin(
      admin,
      studentId,
      academicTermId.trim(),
    );
  }
}
