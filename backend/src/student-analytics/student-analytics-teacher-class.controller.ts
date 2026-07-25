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
import { TeacherJwtAuthGuard } from 'src/teacher/guards/teacher-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Teacher } from 'src/teacher/teacher.entity';
import {
  StudentAnalyticsService,
  ClusterName,
} from './student-analytics.service';

@ApiTags('Teacher')
@ApiBearerAuth()
@Controller('teacher/classes')
export class StudentAnalyticsTeacherClassController {
  constructor(
    private readonly studentAnalyticsService: StudentAnalyticsService,
  ) {}

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(':classLevelId/analytics-subjects')
  @Roles(Role.Teacher)
  @ApiOperation({
    summary:
      'List subjects available for Performance Analytics filters in a class',
    description:
      'Class teachers receive every subject offered in the class. Subject teachers receive only the subject catalogs they are assigned to teach in that class.',
  })
  @ApiParam({ name: 'classLevelId', description: 'UUID of the class level' })
  async getAnalyticsSubjects(
    @Param('classLevelId') classLevelId: string,
    @CurrentUser() teacher: Teacher,
  ) {
    return this.studentAnalyticsService.getTeacherAnalyticsSubjectsForClass(
      teacher,
      classLevelId,
    );
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(':classLevelId/subject-performance')
  @Roles(Role.Teacher)
  @ApiOperation({
    summary: 'Get subject performance breakdown for all students in a class',
    description:
      'Teacher-scoped mirror of the school-admin class subject-performance endpoint. Class teachers may query any subject in the class; subject teachers may only query subjects they teach in that class. Returns every student with point-weighted aggregated score, rank, and performance cluster for a given subject and term.',
  })
  @ApiParam({ name: 'classLevelId', description: 'UUID of the class level' })
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
  @ApiQuery({
    name: 'cluster',
    description: 'Filter by cluster name',
    required: false,
    enum: [
      'Below Expectations',
      'Developing',
      'On Track',
      'Meeting Expectations',
    ],
  })
  @ApiQuery({
    name: 'scoreRangeMin',
    description: 'Minimum aggregated score % (0–100)',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'scoreRangeMax',
    description: 'Maximum aggregated score % (0–100)',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'aggregatedAsOf',
    description:
      'Inclusive cutoff date (YYYY-MM-DD). Only assignments graded on or before this date are included in term-to-date progress.',
    required: false,
    type: String,
  })
  async getClassSubjectPerformance(
    @Param('classLevelId') classLevelId: string,
    @Query('academicTermId') academicTermId: string,
    @Query('subjectCatalogId') subjectCatalogId: string,
    @Query('cluster') cluster: string | undefined,
    @Query('scoreRangeMin') scoreRangeMin: string | undefined,
    @Query('scoreRangeMax') scoreRangeMax: string | undefined,
    @Query('aggregatedAsOf') aggregatedAsOf: string | undefined,
    @CurrentUser() teacher: Teacher,
  ) {
    if (!academicTermId?.trim()) {
      throw new BadRequestException('academicTermId is required');
    }
    if (!subjectCatalogId?.trim()) {
      throw new BadRequestException('subjectCatalogId is required');
    }

    const validClusters: ClusterName[] = [
      'Below Expectations',
      'Developing',
      'On Track',
      'Meeting Expectations',
    ];

    const clusterFilter =
      cluster && validClusters.includes(cluster as ClusterName)
        ? (cluster as ClusterName)
        : undefined;

    const minFilter =
      scoreRangeMin !== undefined ? parseFloat(scoreRangeMin) : undefined;
    const maxFilter =
      scoreRangeMax !== undefined ? parseFloat(scoreRangeMax) : undefined;

    return this.studentAnalyticsService.getClassSubjectPerformanceForTeacher(
      teacher,
      classLevelId,
      academicTermId.trim(),
      subjectCatalogId.trim(),
      {
        cluster: clusterFilter,
        scoreRangeMin:
          minFilter !== undefined && !isNaN(minFilter) ? minFilter : undefined,
        scoreRangeMax:
          maxFilter !== undefined && !isNaN(maxFilter) ? maxFilter : undefined,
        aggregatedAsOf: aggregatedAsOf?.trim() || undefined,
      },
    );
  }
}
