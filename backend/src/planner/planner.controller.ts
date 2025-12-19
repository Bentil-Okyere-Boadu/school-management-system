import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PlannerService } from './planner.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateEventCategoryDto } from './dto/create-event-category.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';
import { SchoolAdminJwtAuthGuard } from '../school-admin/guards/school-admin-jwt-auth.guard';
import { TeacherJwtAuthGuard } from '../teacher/guards/teacher-jwt-auth.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Student } from '../student/student.entity';
import { StudentJwtAuthGuard } from '../student/guards/student-jwt-auth.guard';
import { VisibilityScope } from './entities/event.entity';
import { SanitizeResponseInterceptor } from '../common/interceptors/sanitize-response.interceptor';

@Controller('planner')
@UseInterceptors(SanitizeResponseInterceptor)
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('categories')
  @Roles(Role.SchoolAdmin)
  createCategory(
    @Body() dto: CreateEventCategoryDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.plannerService.createCategory(dto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('categories')
  @Roles(Role.SchoolAdmin)
  findAllCategories(@CurrentUser() admin: SchoolAdmin) {
    return this.plannerService.findAllCategories(admin.school.id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('categories/:id')
  @Roles(Role.SchoolAdmin)
  findOneCategory(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.plannerService.findOneCategory(id, admin.school.id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('categories/:id')
  @Roles(Role.SchoolAdmin)
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateEventCategoryDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.plannerService.updateCategory(id, dto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete('categories/:id')
  @Roles(Role.SchoolAdmin)
  removeCategory(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.plannerService.removeCategory(id, admin);
  }

  // Event endpoints - SchoolAdmin
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('events')
  @Roles(Role.SchoolAdmin)
  @UseInterceptors(FilesInterceptor('files', 10))
  createEvent(
    @Body() dto: CreateEventDto,
    @CurrentUser() admin: SchoolAdmin,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.plannerService.createEvent(dto, admin, files);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('events')
  @Roles(Role.SchoolAdmin)
  findAllEvents(
    @CurrentUser() admin: SchoolAdmin,
    @Query('categoryId') categoryId?: string,
    @Query('classLevelId') classLevelId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('visibilityScope') visibilityScope?: VisibilityScope,
  ) {
    return this.plannerService.findAllEvents(admin.school.id, {
      categoryId,
      classLevelId,
      subjectId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      visibilityScope,
    });
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('events/:id')
  @Roles(Role.SchoolAdmin)
  findOneEvent(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.plannerService.findOneEvent(id, admin.school.id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('events/:id')
  @Roles(Role.SchoolAdmin)
  updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.plannerService.updateEvent(id, dto, admin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete('events/:id')
  @Roles(Role.SchoolAdmin)
  removeEvent(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.plannerService.removeEvent(id, admin);
  }

  // Event endpoints - Teacher
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('teacher/events')
  @Roles(Role.Teacher)
  @UseInterceptors(FilesInterceptor('files', 10))
  createEventAsTeacher(
    @Body() dto: CreateEventDto,
    @CurrentUser() teacher: Teacher,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.plannerService.createEvent(dto, teacher, files);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('teacher/events')
  @Roles(Role.Teacher)
  findAllEventsAsTeacher(
    @CurrentUser() teacher: Teacher,
    @Query('categoryId') categoryId?: string,
    @Query('classLevelId') classLevelId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.plannerService.findAllEvents(teacher.school.id, {
      categoryId,
      classLevelId,
      subjectId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('teacher/events/:id')
  @Roles(Role.Teacher)
  findOneEventAsTeacher(
    @Param('id') id: string,
    @CurrentUser() teacher: Teacher,
  ) {
    return this.plannerService.findOneEvent(id, teacher.school.id);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('teacher/events/:id')
  @Roles(Role.Teacher)
  updateEventAsTeacher(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() teacher: Teacher,
  ) {
    return this.plannerService.updateEvent(id, dto, teacher);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete('teacher/events/:id')
  @Roles(Role.Teacher)
  removeEventAsTeacher(
    @Param('id') id: string,
    @CurrentUser() teacher: Teacher,
  ) {
    return this.plannerService.removeEvent(id, teacher);
  }

  // Event endpoints - Student/Parent (read-only)
  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('student/events')
  @Roles(Role.Student)
  findAllEventsAsStudent(
    @CurrentUser() student: Student,
    @Query('categoryId') categoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.plannerService.findEventsForStudent(student.id, {
      categoryId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('student/events/:id')
  @Roles(Role.Student)
  findOneEventAsStudent(
    @Param('id') id: string,
    @CurrentUser() student: Student,
  ) {
    // Students can view events from their school
    return this.plannerService.findOneEvent(id, student.school.id);
  }

  // Categories visible to all (for filtering)
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('teacher/categories')
  @Roles(Role.Teacher)
  findAllCategoriesAsTeacher(@CurrentUser() teacher: Teacher) {
    return this.plannerService.findAllCategories(teacher.school.id);
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('student/categories')
  @Roles(Role.Student)
  findAllCategoriesAsStudent(@CurrentUser() student: Student) {
    return this.plannerService.findAllCategories(student.school.id);
  }
}
