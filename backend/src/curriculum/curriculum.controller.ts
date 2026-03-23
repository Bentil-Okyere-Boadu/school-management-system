import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { CreateSubtopicDto } from './dto/create-subtopic.dto';
import { UpdateSubtopicDto } from './dto/update-subtopic.dto';
import { CreateCurriculumTopicNoteDto } from './dto/create-curriculum-topic-note.dto';
import { SchoolAdminJwtAuthGuard } from '../school-admin/guards/school-admin-jwt-auth.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { QueryString } from '../common/api-features/api-features';
import { SanitizeResponseInterceptor } from '../common/interceptors/sanitize-response.interceptor';
import { UseInterceptors } from '@nestjs/common';

@Controller('curriculum')
@UseInterceptors(SanitizeResponseInterceptor)
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  // Curriculum CRUD endpoints
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post()
  @Roles(Role.SchoolAdmin)
  create(
    @Body() createCurriculumDto: CreateCurriculumDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.curriculumService.create(createCurriculumDto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get()
  @Roles(Role.SchoolAdmin)
  findAll(@CurrentUser() admin: SchoolAdmin, @Query() query: QueryString) {
    return this.curriculumService.findAll(admin.school.id, query);
  }

  // Topic CRUD endpoints - Must come before :id routes to avoid route conflicts
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('topics')
  @Roles(Role.SchoolAdmin)
  createTopic(
    @Body() createTopicDto: CreateTopicDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.curriculumService.createTopic(createTopicDto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('topics')
  @Roles(Role.SchoolAdmin)
  findAllTopics(
    @CurrentUser() admin: SchoolAdmin,
    @Query() query: QueryString,
  ) {
    return this.curriculumService.findAllTopics(admin.school.id, query);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('topics/:topicId/detail')
  @Roles(Role.SchoolAdmin)
  getTopicDetail(
    @CurrentUser() admin: SchoolAdmin,
    @Param('topicId') topicId: string,
    @Query('subjectId') subjectId: string,
    @Query('classLevelId') classLevelId: string,
    @Query('academicTermId') academicTermId?: string,
  ) {
    if (!classLevelId) {
      throw new BadRequestException('classLevelId query parameter is required');
    }
    return this.curriculumService.getTopicDetail(
      topicId,
      subjectId,
      admin.school.id,
      classLevelId,
      academicTermId,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('topics/:topicId/subtopics')
  @Roles(Role.SchoolAdmin)
  createSubtopic(
    @Param('topicId') topicId: string,
    @Body() dto: CreateSubtopicDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.curriculumService.createSubtopic(topicId, dto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('topics/:topicId/subtopics')
  @Roles(Role.SchoolAdmin)
  findSubtopicsByTopic(
    @Param('topicId') topicId: string,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.curriculumService.findSubtopicsByTopic(
      topicId,
      admin.school.id,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('topics/:id')
  @Roles(Role.SchoolAdmin)
  findOneTopic(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.curriculumService.findOneTopic(id, admin.school.id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Patch('topics/:id')
  @Roles(Role.SchoolAdmin)
  updateTopic(
    @Param('id') id: string,
    @Body() updateTopicDto: UpdateTopicDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.curriculumService.updateTopic(id, updateTopicDto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete('topics/:id')
  @Roles(Role.SchoolAdmin)
  removeTopic(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.curriculumService.removeTopic(id, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('curricula/:curriculumId/topics')
  @Roles(Role.SchoolAdmin)
  findAllTopicsByCurriculum(
    @Param('curriculumId') curriculumId: string,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.curriculumService.findAllTopicsByCurriculum(
      curriculumId,
      admin.school.id,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('subject-catalogs/:subjectCatalogId/topics')
  @Roles(Role.SchoolAdmin)
  findAllTopicsBySubjectCatalog(
    @Param('subjectCatalogId') subjectCatalogId: string,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.curriculumService.findAllTopicsBySubjectCatalog(
      subjectCatalogId,
      admin.school.id,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('progress-dashboard')
  @Roles(Role.SchoolAdmin)
  getProgressDashboard(
    @CurrentUser() admin: SchoolAdmin,
    @Query('curriculumId') curriculumId?: string,
    @Query('subjectCatalogId') subjectCatalogId?: string,
    @Query('classLevelId') classLevelId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('academicTermId') academicTermId?: string,
  ) {
    return this.curriculumService.getProgressDashboard(admin.school.id, {
      curriculumId,
      subjectCatalogId,
      classLevelId,
      teacherId,
      academicTermId,
    });
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Patch('subtopics/:id')
  @Roles(Role.SchoolAdmin)
  updateSubtopic(
    @Param('id') id: string,
    @Body() dto: UpdateSubtopicDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.curriculumService.updateSubtopic(id, dto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete('subtopics/:id')
  @Roles(Role.SchoolAdmin)
  removeSubtopic(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.curriculumService.removeSubtopic(id, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('notes')
  @Roles(Role.SchoolAdmin)
  createNote(
    @Body() dto: CreateCurriculumTopicNoteDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.curriculumService.createNote(dto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('topics/:topicId/notes')
  @Roles(Role.SchoolAdmin)
  getNotesForTopic(
    @Param('topicId') topicId: string,
    @CurrentUser() admin: SchoolAdmin,
    @Query('subjectId') subjectId?: string,
    @Query('academicTermId') academicTermId?: string,
  ) {
    return this.curriculumService.getNotesForTopic(
      topicId,
      admin.school.id,
      subjectId,
      academicTermId,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete('notes/:id')
  @Roles(Role.SchoolAdmin)
  deleteNote(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.curriculumService.deleteNote(id, admin);
  }

  // Curriculum specific routes - Must come after specific routes
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(':id')
  @Roles(Role.SchoolAdmin)
  findOne(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.curriculumService.findOne(id, admin.school.id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Patch(':id')
  @Roles(Role.SchoolAdmin)
  update(
    @Param('id') id: string,
    @Body() updateCurriculumDto: UpdateCurriculumDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.curriculumService.update(id, updateCurriculumDto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete(':id')
  @Roles(Role.SchoolAdmin)
  remove(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.curriculumService.remove(id, admin);
  }
}
