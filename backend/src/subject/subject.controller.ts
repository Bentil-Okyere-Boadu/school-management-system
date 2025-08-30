import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  Delete,
  Get,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SubjectService } from './subject.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { TeacherJwtAuthGuard } from '../teacher/guards/teacher-jwt-auth.guard';
import { Teacher } from 'src/teacher/teacher.entity';
import { AcademicCalendarService } from '../academic-calendar/academic-calendar.service';
import { Student } from 'src/student/student.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { StudentJwtAuthGuard } from 'src/student/guards/student-jwt-auth.guard';
import { QueryString } from 'src/common/api-features/api-features';
import { IsClassTeacherGuard } from 'src/auth/guards/class-teacher.guard';

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
  @UseGuards(
    TeacherJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    IsClassTeacherGuard,
  )
  @UseGuards(
    TeacherJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    IsClassTeacherGuard,
  )
  @Post('approve-class-results')
  async approveClassResults(
    @Body('classLevelId') classLevelId: string,
    @CurrentUser() teacher: Teacher,
    @Body('forceApprove') forceApprove?: boolean,
  ) {
    return this.subjectService.approveClassResults(
      classLevelId,
      teacher,
      forceApprove,
    );
  }
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('my-classes')
  async getMyClasses(
    @CurrentUser() teacher: Teacher,
    @Query() query: QueryString,
  ) {
    return this.subjectService.getClassesForTeacher(teacher.id, query);
  }
  @Get('students/:studentId/results/:academicCalendarId')
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  async getStudentResults(
    @Param('studentId') studentId: string,
    @Param('academicCalendarId') academicCalendarId: string,
  ) {
    return this.subjectService.getStudentResults(studentId, academicCalendarId);
  }

  @Get('students/term-results/:studentId')
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  async getStudentResultsByTerm(
    @Param('studentId') studentId: string,
    @Query('academicCalendarId') academicCalendarId: string,
    @Query('academicTermId') academicTermId: string,
  ) {
    if (!academicCalendarId || !academicTermId) {
      throw new BadRequestException('calendarId and termId are required');
    }

    return this.subjectService.getStudentResultsByTerm(
      studentId,
      academicCalendarId,
      academicTermId,
    );
  }
  @Post('students/:studentId/terms/:termId/remarks')
  @UseGuards(
    TeacherJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    IsClassTeacherGuard,
  )
  async submitTermRemarks(
    @CurrentUser() teacher: Teacher,
    @Param('studentId') studentId: string,
    @Param('termId') termId: string,
    @Body() body: { remarks: string },
  ) {
    return this.subjectService.submitTermRemarks(teacher.id, {
      studentId,
      academicTermId: termId,
      remarks: body.remarks,
    });
  }

  @Get('students/results/:academicCalendarId')
  @Roles('student')
  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  async getMyResult(
    @CurrentUser() student: Student,
    @Param('academicCalendarId') academicCalendarId: string,
  ) {
    return this.subjectService.getStudentResults(
      student.id,
      academicCalendarId,
    );
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
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

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('submit-grades')
  async submitGrades(
    @CurrentUser() teacher: Teacher,
    @Body()
    body: {
      classLevelId: string;
      subjectId: string;
      academicTermId: string;
      grades: Array<{
        studentId: string;
        classScore: number; // 30%
        examScore: number; // 70%
      }>;
    },
  ) {
    return this.subjectService.submitGrades({
      ...body,
      teacherId: teacher.id,
    });
  }
}
