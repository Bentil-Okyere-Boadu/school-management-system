import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AcademicCalendarService } from './academic-calendar.service';
import { CreateAcademicCalendarDto } from './dto/create-academic-calendar.dto';
import { UpdateAcademicCalendarDto } from './dto/update-academic-calendar.dto';
import { CreateAcademicTermDto } from './dto/create-academic-term.dto';
import { UpdateAcademicTermDto } from './dto/update-academic-term.dto';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('academic-calendar')
@UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles('school_admin')
export class AcademicCalendarController {
  constructor(
    private readonly academicCalendarService: AcademicCalendarService,
  ) {}

  @Roles('school_admin')
  @Post()
  createCalendar(
    @Body() createAcademicCalendarDto: CreateAcademicCalendarDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.academicCalendarService.createCalendar(
      createAcademicCalendarDto,
      admin,
    );
  }

  @Get()
  @Roles('school_admin', 'super_admin')
  findAllCalendars(@CurrentUser() admin: SchoolAdmin) {
    return this.academicCalendarService.findAllCalendars(admin.school.id);
  }

  @Get(':id')
  @Roles('school_admin', 'super_admin')
  findOneCalendar(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.academicCalendarService.findOneCalendar(id, admin.school.id);
  }

  @Put(':id')
  updateCalendar(
    @Param('id') id: string,
    @Body() updateAcademicCalendarDto: UpdateAcademicCalendarDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.academicCalendarService.updateCalendar(
      id,
      updateAcademicCalendarDto,
      admin,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles('school_admin')
  @Delete(':id')
  removeCalendar(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.academicCalendarService.removeCalendar(id, admin);
  }
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles('school_admin')
  @Post('term')
  createTerm(
    @Body() createAcademicTermDto: CreateAcademicTermDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.academicCalendarService.createTerm(
      createAcademicTermDto,
      admin,
    );
  }

  @Get(':calendarId/terms')
  findAllTerms(
    @Param('calendarId') calendarId: string,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.academicCalendarService.findAllTerms(calendarId, admin);
  }

  @Get('term/:id')
  findOneTerm(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.academicCalendarService.findOneTerm(id, admin);
  }

  @Put('term/:id')
  updateTerm(
    @Param('id') id: string,
    @Body() updateAcademicTermDto: UpdateAcademicTermDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.academicCalendarService.updateTerm(
      id,
      updateAcademicTermDto,
      admin,
    );
  }

  @Delete('term/:id')
  removeTerm(@Param('id') id: string, @CurrentUser() admin: SchoolAdmin) {
    return this.academicCalendarService.removeTerm(id, admin);
  }
}
