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
import { SubmitGradesDto } from './dto/submit-grades.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import {
  AdminResultActionDto,
  AdminReturnResultsDto,
} from './dto/admin-results.dto';
import { TeacherJwtAuthGuard } from '../teacher/guards/teacher-jwt-auth.guard';
import { Teacher } from 'src/teacher/teacher.entity';
import { AcademicCalendarService } from '../academic-calendar/academic-calendar.service';
import { Student } from 'src/student/student.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { StudentJwtAuthGuard } from 'src/student/guards/student-jwt-auth.guard';
import { QueryString } from 'src/common/api-features/api-features';
import { IsClassTeacherGuard } from 'src/auth/guards/class-teacher.guard';
import { ClassLevelResultNotApprovedGuard } from 'src/auth/guards/classLevelResultNotApproved.guard';
import { Role } from 'src/auth/enums/role.enum';
/*
Subject = a teaching assignment: one teacher + one SubjectCatalog + one or more ClassLevels (e.g. “Mr. Kofi teaches Mathematics to Grade 8”
*/
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
  @Post('toggle-class-results-approval')
  async toggleClassResultsApproval(
    @Body('classLevelId') classLevelId: string,
    @CurrentUser() teacher: Teacher,
    @Body('action') action: 'approve' | 'unapprove' = 'approve',
    @Body('forceApprove') forceApprove?: boolean,
    @Body('academicTermId') academicTermId?: string,
  ) {
    return this.subjectService.toggleClassResultsApproval(
      classLevelId,
      teacher,
      action,
      forceApprove,
      academicTermId,
    );
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('class-results-approval-status/:classLevelId')
  async getClassResultsApprovalStatus(
    @Param('classLevelId') classLevelId: string,
    @Query('academicTermId') academicTermId: string | undefined,
    @CurrentUser() teacher: Teacher,
  ) {
    return this.subjectService.getClassResultsApprovalStatus(
      classLevelId,
      teacher,
      academicTermId,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('school-admin/toggle-class-results-approval')
  async toggleSchoolAdminApproval(
    @Body('classLevelId') classLevelId: string,
    @CurrentUser() schoolAdmin: SchoolAdmin,
    @Body('action') action: 'approve' | 'unapprove' = 'approve',
    @Body('academicTermId') academicTermId?: string,
  ) {
    return this.subjectService.toggleSchoolAdminApproval(
      classLevelId,
      schoolAdmin,
      action,
      academicTermId,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('school-admin/class-results-approval-status/:classLevelId')
  async getSchoolAdminClassResultsApprovalStatus(
    @Param('classLevelId') classLevelId: string,
    @Query('academicTermId') academicTermId: string | undefined,
    @CurrentUser() schoolAdmin: SchoolAdmin,
  ) {
    return this.subjectService.getClassResultsApprovalStatus(
      classLevelId,
      schoolAdmin,
      academicTermId,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('school-admin/all-class-results-approval-status')
  async getAllClassResultsApprovalStatus(
    @CurrentUser() schoolAdmin: SchoolAdmin,
  ) {
    return this.subjectService.getAllClassResultsApprovalStatus(schoolAdmin);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('school-admin/check-results')
  async adminCheckResults(
    @Body() body: AdminResultActionDto,
    @CurrentUser() schoolAdmin: SchoolAdmin,
  ) {
    return this.subjectService.adminCheckResults(
      body.classLevelId,
      body.academicTermId,
      schoolAdmin,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('school-admin/return-results')
  async adminReturnResults(
    @Body() body: AdminReturnResultsDto,
    @CurrentUser() schoolAdmin: SchoolAdmin,
  ) {
    return this.subjectService.adminReturnResults(
      body.classLevelId,
      body.academicTermId,
      body.returnNote,
      schoolAdmin,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('school-admin/publish-results')
  async adminPublishResults(
    @Body() body: AdminResultActionDto,
    @CurrentUser() schoolAdmin: SchoolAdmin,
  ) {
    return this.subjectService.adminPublishResults(
      body.classLevelId,
      body.academicTermId,
      schoolAdmin,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('school-admin/results-review')
  async getAdminResultsReview(
    @CurrentUser() schoolAdmin: SchoolAdmin,
    @Query('classLevelId') classLevelId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('academicTermId') academicTermId?: string,
  ) {
    return this.subjectService.getAdminResultsReview(schoolAdmin, {
      classLevelId,
      subjectId,
      teacherId,
      academicTermId,
    });
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('school-admin/submission-history/:classLevelId')
  async getGradeSubmissionHistory(
    @Param('classLevelId') classLevelId: string,
    @Query('academicTermId') academicTermId: string,
    @CurrentUser() schoolAdmin: SchoolAdmin,
  ) {
    return this.subjectService.getGradeSubmissionHistory(
      classLevelId,
      academicTermId,
      schoolAdmin,
    );
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Teacher)
  @Get('grading-legend')
  async getGradingLegend(
    @CurrentUser() teacher: Teacher,
    @Query('classLevelId') classLevelId?: string,
    @Query('academicTermId') academicTermId?: string,
  ) {
    return this.subjectService.getActiveGradingLegend(
      teacher.school.id,
      classLevelId,
      academicTermId,
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
    @CurrentUser() schoolAdmin: SchoolAdmin,
  ) {
    return this.subjectService.getStudentResults(
      studentId,
      academicCalendarId,
      schoolAdmin,
    );
  }

  @Get('students/term-results/:studentId')
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  async getStudentResultsByTerm(
    @Param('studentId') studentId: string,
    @Query('academicCalendarId') academicCalendarId: string,
    @Query('academicTermId') academicTermId: string,
    @CurrentUser() teacher: Teacher,
  ) {
    if (!academicCalendarId || !academicTermId) {
      throw new BadRequestException('calendarId and termId are required');
    }

    return this.subjectService.getStudentResultsByTerm(
      studentId,
      academicCalendarId,
      academicTermId,
      teacher,
    );
  }
  @Post('students/:studentId/terms/:termId/remarks')
  @UseGuards(
    TeacherJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    IsClassTeacherGuard,
    ClassLevelResultNotApprovedGuard,
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
  @Roles(Role.Student)
  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  async getMyResult(
    @CurrentUser() student: Student,
    @Param('academicCalendarId') academicCalendarId: string,
  ) {
    return this.subjectService.getStudentResults(
      student.id,
      academicCalendarId,
      student,
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
      const term = await this.academicCalendarService.getTermWithCalendar(
        termId,
      );
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
      teacher.id,
    );
  }

  @UseGuards(
    TeacherJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    ClassLevelResultNotApprovedGuard,
  )
  @Post('submit-grades')
  async submitGrades(
    @CurrentUser() teacher: Teacher,
    @Body() body: SubmitGradesDto,
  ) {
    return this.subjectService.submitGrades({
      ...body,
      teacherId: teacher.id,
    });
  }
}
