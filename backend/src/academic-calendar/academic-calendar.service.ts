import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicCalendar } from './entitites/academic-calendar.entity';
import { AcademicTerm } from './entitites/academic-term.entity';
import { Holiday } from './entitites/holiday.entity';
import { CreateAcademicCalendarDto } from './dto/create-academic-calendar.dto';
import { UpdateAcademicCalendarDto } from './dto/update-academic-calendar.dto';
import { CreateAcademicTermDto } from './dto/create-academic-term.dto';
import { UpdateAcademicTermDto } from './dto/update-academic-term.dto';
import { School } from 'src/school/school.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';

@Injectable()
export class AcademicCalendarService {
  constructor(
    @InjectRepository(AcademicCalendar)
    private calendarRepository: Repository<AcademicCalendar>,
    @InjectRepository(AcademicTerm)
    private termRepository: Repository<AcademicTerm>,
    @InjectRepository(Holiday)
    private holidayRepository: Repository<Holiday>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
  ) {}

  // Academic Calendar CRUD operations
  async createCalendar(
    createDto: CreateAcademicCalendarDto,
    admin: SchoolAdmin,
  ): Promise<AcademicCalendar> {
    const school = await this.schoolRepository.findOne({
      where: { id: admin.school.id },
    });
    if (!school) {
      throw new NotFoundException(`School not found`);
    }

    const calendar = this.calendarRepository.create({
      name: createDto.name,
      school,
    });

    return this.calendarRepository.save(calendar);
  }

  async findAllCalendars(schoolId: string): Promise<AcademicCalendar[]> {
    return this.calendarRepository.find({
      where: { school: { id: schoolId } },
      relations: ['terms', 'terms.holidays'],
    });
  }

  async findOneCalendar(
    id: string,
    schoolId: string,
  ): Promise<AcademicCalendar> {
    const calendar = await this.calendarRepository.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['terms', 'terms.holidays'],
    });

    if (!calendar) {
      throw new NotFoundException(`Academic Calendar with ID ${id} not found`);
    }

    return calendar;
  }

  async updateCalendar(
    id: string,
    updateDto: UpdateAcademicCalendarDto,
    admin: SchoolAdmin,
  ): Promise<AcademicCalendar> {
    const calendar = await this.calendarRepository.findOne({
      where: { id },
      relations: ['school'],
    });

    if (!calendar) {
      throw new NotFoundException(`Academic Calendar with ID ${id} not found`);
    }

    // Check if admin belongs to the same school as the calendar
    if (calendar.school.id !== admin.school.id) {
      throw new ForbiddenException(
        'You can only update calendars for your school',
      );
    }

    if (updateDto.name) {
      calendar.name = updateDto.name;
    }

    return this.calendarRepository.save(calendar);
  }

  async removeCalendar(id: string, admin: SchoolAdmin): Promise<void> {
    const calendar = await this.calendarRepository.findOne({
      where: { id },
      relations: ['school'],
    });

    if (!calendar) {
      throw new NotFoundException(`Academic Calendar with ID ${id} not found`);
    }

    // Check if admin belongs to the same school as the calendar
    if (calendar.school.id !== admin.school.id) {
      throw new ForbiddenException(
        'You can only delete calendars for your school',
      );
    }

    await this.calendarRepository.remove(calendar);
  }

  // Academic Term CRUD operations
  async createTerm(
    createDto: CreateAcademicTermDto,
    admin: SchoolAdmin,
  ): Promise<AcademicTerm | null> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: createDto.academicCalendarId },
      relations: ['school'],
    });

    if (!calendar) {
      throw new NotFoundException(
        `Academic Calendar with ID ${createDto.academicCalendarId} not found`,
      );
    }

    // Check if admin belongs to the same school as the calendar
    if (calendar.school.id !== admin.school.id) {
      throw new ForbiddenException(
        'You can only add terms to calendars for your school',
      );
    }

    // Validate dates
    if (new Date(createDto.startDate) >= new Date(createDto.endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Create term
    const term = this.termRepository.create({
      termName: createDto.termName,
      startDate: createDto.startDate,
      endDate: createDto.endDate,
      academicCalendar: calendar,
    });

    const savedTerm = await this.termRepository.save(term);

    // Create holidays if provided
    if (createDto.holidays && createDto.holidays.length > 0) {
      const holidays = createDto.holidays.map((holidayDto) =>
        this.holidayRepository.create({
          name: holidayDto.name,
          date: holidayDto.date,
          term: savedTerm,
        }),
      );
      await this.holidayRepository.save(holidays);
    }

    // Fetch and return the term with holidays
    return this.termRepository.findOne({
      where: { id: savedTerm.id },
      relations: ['holidays'],
    });
  }

  async findAllTerms(
    calendarId: string,
    admin: SchoolAdmin,
  ): Promise<AcademicTerm[]> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId },
      relations: ['school'],
    });

    if (!calendar) {
      throw new NotFoundException(
        `Academic Calendar with ID ${calendarId} not found`,
      );
    }

    // Check if admin belongs to the same school as the calendar
    if (calendar.school.id !== admin.school.id) {
      throw new ForbiddenException(
        'You can only view terms for calendars in your school',
      );
    }

    return this.termRepository.find({
      where: { academicCalendar: { id: calendarId } },
      relations: ['holidays'],
    });
  }

  async findOneTerm(id: string, admin: SchoolAdmin): Promise<AcademicTerm> {
    const term = await this.termRepository.findOne({
      where: { id },
      relations: ['academicCalendar', 'academicCalendar.school', 'holidays'],
    });

    if (!term) {
      throw new NotFoundException(`Academic Term with ID ${id} not found`);
    }

    // Check if admin belongs to the same school as the term's calendar
    if (term.academicCalendar.school.id !== admin.school.id) {
      throw new ForbiddenException(
        'You can only view terms for calendars in your school',
      );
    }

    return term;
  }

  async updateTerm(
    id: string,
    updateDto: UpdateAcademicTermDto,
    admin: SchoolAdmin,
  ) {
    const term = await this.termRepository.findOne({
      where: { id },
      relations: ['academicCalendar', 'academicCalendar.school', 'holidays'],
    });

    if (!term) {
      throw new NotFoundException(`Academic Term with ID ${id} not found`);
    }

    // Check if admin belongs to the same school as the term's calendar
    if (term.academicCalendar.school.id !== admin.school.id) {
      throw new ForbiddenException(
        'You can only update terms for calendars in your school',
      );
    }

    // Update term properties
    if (updateDto.termName) {
      term.termName = updateDto.termName;
    }

    if (updateDto.startDate) {
      term.startDate = updateDto.startDate;
    }

    if (updateDto.endDate) {
      term.endDate = updateDto.endDate;
    }

    // Validate dates if both are provided
    if (updateDto.startDate && updateDto.endDate) {
      if (new Date(updateDto.startDate) >= new Date(updateDto.endDate)) {
        throw new BadRequestException('Start date must be before end date');
      }
    } else if (
      updateDto.startDate &&
      new Date(updateDto.startDate) >= new Date(term.endDate)
    ) {
      throw new BadRequestException('Start date must be before end date');
    } else if (
      updateDto.endDate &&
      new Date(term.startDate) >= new Date(updateDto.endDate)
    ) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Update holidays if provided
    if (updateDto.holidays && updateDto.holidays.length > 0) {
      // Remove existing holidays
      if (term.holidays && term.holidays.length > 0) {
        await this.holidayRepository.remove(term.holidays);
      }

      // Create new holidays
      const holidays = updateDto.holidays.map((holidayDto) =>
        this.holidayRepository.create({
          name: holidayDto.name,
          date: holidayDto.date,
          term,
        }),
      );
      await this.holidayRepository.save(holidays);
    }

    // Save term
    await this.termRepository.save(term);

    // Return updated term with holidays
    return this.termRepository.findOne({
      where: { id },
      relations: ['holidays'],
    });
  }

  async removeTerm(id: string, admin: SchoolAdmin): Promise<void> {
    const term = await this.termRepository.findOne({
      where: { id },
      relations: ['academicCalendar', 'academicCalendar.school'],
    });

    if (!term) {
      throw new NotFoundException(`Academic Term with ID ${id} not found`);
    }

    // Check if admin belongs to the same school as the term's calendar
    if (term.academicCalendar.school.id !== admin.school.id) {
      throw new ForbiddenException(
        'You can only delete terms for calendars in your school',
      );
    }

    await this.termRepository.remove(term);
  }

  // Add these methods to the service
  async findAllCalendarsForSuperAdmin(): Promise<AcademicCalendar[]> {
    return this.calendarRepository.find({
      relations: ['terms', 'school'],
    });
  }

  async findOneCalendarForSuperAdmin(id: string): Promise<AcademicCalendar> {
    const calendar = await this.calendarRepository.findOne({
      where: { id },
      relations: ['terms', 'terms.holidays', 'school'],
    });

    if (!calendar) {
      throw new NotFoundException(`Academic Calendar with ID ${id} not found`);
    }

    return calendar;
  }

  async removeCalendarAsSuperAdmin(id: string): Promise<void> {
    const calendar = await this.calendarRepository.findOne({
      where: { id },
    });

    if (!calendar) {
      throw new NotFoundException(`Academic Calendar with ID ${id} not found`);
    }

    await this.calendarRepository.remove(calendar);
  }
}
