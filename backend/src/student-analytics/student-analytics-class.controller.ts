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
import {
  StudentAnalyticsService,
  ClusterName,
} from './student-analytics.service';

@ApiTags('School Admin')
@ApiBearerAuth()
@Controller('school-admin/classes')
export class StudentAnalyticsClassController {
  constructor(
    private readonly studentAnalyticsService: StudentAnalyticsService,
  ) {}

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(':classLevelId/subject-performance')
  @Roles(Role.SchoolAdmin)
  @ApiOperation({
    summary: 'Get subject performance breakdown for all students in a class',
    description:
      'Returns every student in the class with their point-weighted aggregated assignment score (total earned ÷ total possible), rank, and performance cluster for a given subject and term. Only assignments graded on or before aggregatedAsOf (YYYY-MM-DD) are included when that query param is set. Clusters are derived from the school grading system bands (not class rank). Also includes summary stats (average, median, highest, lowest), aggregation metadata, and cluster distribution counts. Supports optional filtering by cluster name and score range.',
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
    @CurrentUser() admin: SchoolAdmin,
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

    return this.studentAnalyticsService.getClassSubjectPerformance(
      admin,
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
