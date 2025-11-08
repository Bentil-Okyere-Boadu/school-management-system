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
} from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { SchoolAdminJwtAuthGuard } from '../school-admin/guards/school-admin-jwt-auth.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
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
  @Roles('school_admin')
  create(
    @Body() createCurriculumDto: CreateCurriculumDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.curriculumService.create(createCurriculumDto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get()
  @Roles('school_admin')
  findAll(@CurrentUser() admin: SchoolAdmin, @Query() query: QueryString) {
    return this.curriculumService.findAll(admin.school.id, query);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(':id')
  @Roles('school_admin')
  findOne(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.curriculumService.findOne(id, admin.school.id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Patch(':id')
  @Roles('school_admin')
  update(
    @Param('id') id: string,
    @Body() updateCurriculumDto: UpdateCurriculumDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.curriculumService.update(id, updateCurriculumDto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete(':id')
  @Roles('school_admin')
  remove(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.curriculumService.remove(id, admin);
  }

  // Topic CRUD endpoints
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('topics')
  @Roles('school_admin')
  createTopic(
    @Body() createTopicDto: CreateTopicDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.curriculumService.createTopic(createTopicDto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('curricula/:curriculumId/topics')
  @Roles('school_admin')
  findAllTopics(
    @Param('curriculumId') curriculumId: string,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.curriculumService.findAllTopics(curriculumId, admin.school.id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('topics/:id')
  @Roles('school_admin')
  findOneTopic(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.curriculumService.findOneTopic(id, admin.school.id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Patch('topics/:id')
  @Roles('school_admin')
  updateTopic(
    @Param('id') id: string,
    @Body() updateTopicDto: UpdateTopicDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.curriculumService.updateTopic(id, updateTopicDto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete('topics/:id')
  @Roles('school_admin')
  removeTopic(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.curriculumService.removeTopic(id, admin);
  }
}
