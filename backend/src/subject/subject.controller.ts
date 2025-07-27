import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  Delete,
  Get,
  Request,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { SubjectService } from './subject.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { Subject } from './subject.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { TeacherJwtAuthGuard } from '../teacher/guards/teacher-jwt-auth.guard';
import { Teacher } from 'src/teacher/teacher.entity';
import { AcademicCalendarService } from '../academic-calendar/academic-calendar.service';

@Controller('subject')
export class SubjectController {
  constructor(
    private readonly subjectService: SubjectService,
    private readonly academicCalendarService: AcademicCalendarService,
  ) {}

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post()
  async create(
    @Body() createSubjectDto: CreateSubjectDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.subjectService.create(createSubjectDto, admin);
  }
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.subjectService.update(id, updateSubjectDto, admin);
  }
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    await this.subjectService.remove(id, admin);
    return { message: 'Subject deleted successfully' };
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('my-classes')
  async getMyClasses(@CurrentUser() teacher: Teacher) {
    return this.subjectService.getClassesForTeacher(teacher.id);
  }

  @UseGuards(TeacherJwtAuthGuard)
  @Get('students-for-grading')
  async getStudentsForGrading(
    @CurrentUser() teacher: Teacher,
    @Query('classLevelId') classLevelId: string,
    @Query('subjectId') subjectId: string,
    @Query('academicCalendarId') academicCalendarId?: string,
    @Query('academicTermId') academicTermId?: string,
  ) {
    let termId = academicTermId;
    let calendarId = academicCalendarId;

    // If only term is provided, infer calendar from term
    if (termId && !calendarId) {
      // Use repository call to get the term with calendar
      const term = await this.academicCalendarService['termRepository'].findOne(
        {
          where: { id: termId },
          relations: ['academicCalendar'],
        },
      );
      if (!term) throw new NotFoundException('Academic term not found');
      calendarId = term.academicCalendar.id;
    }

    // If only calendar is provided, get latest term in that calendar
    if (!termId && calendarId) {
      const latestTerm = await this.academicCalendarService.getLatestTerm(
        String(calendarId),
      );
      if (!latestTerm)
        throw new NotFoundException('No academic term found for this calendar');
      termId = latestTerm.id;
    }

    // If neither is provided, use current calendar and latest term for teacher's school
    if (!termId && !calendarId) {
      const calendar =
        await this.academicCalendarService.getCurrentAcademicCalendar(
          teacher.school.id,
        );
      if (!calendar)
        throw new NotFoundException(
          'No academic calendar found for your school',
        );
      calendarId = calendar.id;
      const latestTerm = await this.academicCalendarService.getLatestTerm(
        String(calendarId),
      );
      if (!latestTerm)
        throw new NotFoundException('No academic term found for your school');
      termId = latestTerm.id;
    }

    return this.subjectService.getStudentsForGrading(
      classLevelId,
      subjectId,
      String(termId),
    );
  }

  // @UseGuards(TeacherJwtAuthGuard)
  // @Post('submit-grades')
  // async submitGrades(
  //   @CurrentUser() teacher: any,
  //   @Body()
  //   body: {
  //     classLevelId: string;
  //     subjectId: string;
  //     academicTermId: string;
  //     grades: Array<{
  //       studentId: string;
  //       classScore: number;
  //       examScore: number;
  //     }>;
  //   },
  // ) {
  //   return this.subjectService.submitGrades({
  //     ...body,
  //     teacherId: teacher.id,
  //   });
  // }
}
