import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { StudentAnalyticsService } from './student-analytics.service';

@ApiTags('School Admin')
@ApiBearerAuth()
@Controller('school-admin/students')
export class StudentAnalyticsAdminController {
  constructor(
    private readonly studentAnalyticsService: StudentAnalyticsService,
  ) {}

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(':studentId/performance-analytics')
  @Roles(Role.SchoolAdmin)
  @ApiOperation({
    summary: 'Get assignment-level performance analytics for a student',
    description:
      "Returns subject → topic → assignment breakdown of a student's graded submissions for a given academic term. Subject, topic, and overall averages use total points earned ÷ total points possible.",
  })
  @ApiParam({ name: 'studentId', description: 'UUID of the student' })
  @ApiQuery({
    name: 'academicTermId',
    description: 'UUID of the academic term',
    required: true,
  })
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

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(':studentId/topic-performance')
  @Roles(Role.SchoolAdmin)
  @ApiOperation({
    summary: 'Get per-topic performance breakdown for a student in a subject',
    description:
      'Returns topic-level point-weighted aggregated scores (total earned ÷ total possible), class-wide average/range/median, test count, and performance cluster for a student in one subject for a given term. Clusters are derived from the school grading system bands. Used for the student detail page in Performance Breakdown.',
  })
  @ApiParam({ name: 'studentId', description: 'UUID of the student' })
  @ApiQuery({
    name: 'academicTermId',
    description: 'UUID of the academic term',
    required: true,
  })
  @ApiQuery({
    name: 'subjectCatalogId',
    description: 'UUID of the subject catalog entry',
    required: true,
  })
  async getTopicPerformance(
    @Param('studentId') studentId: string,
    @Query('academicTermId') academicTermId: string,
    @Query('subjectCatalogId') subjectCatalogId: string,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    if (!academicTermId?.trim()) {
      throw new BadRequestException('academicTermId is required');
    }
    if (!subjectCatalogId?.trim()) {
      throw new BadRequestException('subjectCatalogId is required');
    }
    return this.studentAnalyticsService.getStudentTopicPerformance(
      admin,
      studentId,
      academicTermId.trim(),
      subjectCatalogId.trim(),
    );
  }
}
