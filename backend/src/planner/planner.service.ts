import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Event, VisibilityScope } from './entities/event.entity';
import { EventCategory } from './entities/event-category.entity';
import { EventAttachment } from './entities/event-attachment.entity';
import {
  EventReminder,
  NotificationType,
} from './entities/event-reminder.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateEventCategoryDto } from './dto/create-event-category.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Student } from '../student/student.entity';
import { ClassLevel } from '../class-level/class-level.entity';
import { Subject } from '../subject/subject.entity';
import { ObjectStorageServiceService } from '../object-storage-service/object-storage-service.service';
import { EmailService } from '../common/services/email.service';
import { SmsService } from '../common/services/sms.service';
import { Parent } from '../parent/parent.entity';
import { School } from 'src/school/school.entity';

@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);

  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(EventCategory)
    private categoryRepository: Repository<EventCategory>,
    @InjectRepository(EventAttachment)
    private attachmentRepository: Repository<EventAttachment>,
    @InjectRepository(EventReminder)
    private reminderRepository: Repository<EventReminder>,
    @InjectRepository(ClassLevel)
    private classLevelRepository: Repository<ClassLevel>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    private objectStorageService: ObjectStorageServiceService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  // Event Category CRUD
  async createCategory(
    dto: CreateEventCategoryDto,
    admin: SchoolAdmin,
  ): Promise<EventCategory> {
    const existing = await this.categoryRepository.findOne({
      where: {
        name: dto.name,
        school: { id: admin.school.id },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Category with name "${dto.name}" already exists`,
      );
    }

    const category = this.categoryRepository.create({
      name: dto.name,
      color: dto.color || '#6366f1',
      description: dto.description,
      school: admin.school,
    });

    return this.categoryRepository.save(category);
  }

  async findAllCategories(schoolId: string): Promise<EventCategory[]> {
    return this.categoryRepository.find({
      where: { school: { id: schoolId } },
      order: { name: 'ASC' },
    });
  }

  async findOneCategory(id: string, schoolId: string): Promise<EventCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id, school: { id: schoolId } },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async updateCategory(
    id: string,
    dto: UpdateEventCategoryDto,
    admin: SchoolAdmin,
  ): Promise<EventCategory> {
    const category = await this.findOneCategory(id, admin.school.id);

    // Check if new name conflicts with existing category
    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: {
          name: dto.name,
          school: { id: admin.school.id },
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Category with name "${dto.name}" already exists`,
        );
      }
    }

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async removeCategory(id: string, admin: SchoolAdmin): Promise<void> {
    const category = await this.findOneCategory(id, admin.school.id);

    // Check if category is used by any events
    const eventCount = await this.eventRepository.count({
      where: { category: { id } },
    });

    if (eventCount > 0) {
      throw new BadRequestException(
        `Cannot delete category. It is used by ${eventCount} event(s)`,
      );
    }

    await this.categoryRepository.remove(category);
  }

  async createEvent(
    dto: CreateEventDto,
    creator: SchoolAdmin | Teacher,
    files?: Express.Multer.File[],
  ) {
    let school: School;
    let schoolId: string;

    if (creator.role?.name === 'school_admin') {
      school = creator.school;
      schoolId = school.id;
    } else {
      const teacherWithSchool = await this.eventRepository.manager
        .getRepository(Teacher)
        .findOne({
          where: { id: creator.id },
          relations: ['school'],
        });

      if (!teacherWithSchool?.school) {
        throw new NotFoundException('Teacher school not found');
      }

      school = teacherWithSchool.school;
      schoolId = school.id;
    }

    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId, school: { id: schoolId } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Validate visibility scope and targets
    if (dto.visibilityScope === VisibilityScope.CLASS_LEVEL) {
      if (!dto.targetClassLevelIds || dto.targetClassLevelIds.length === 0) {
        throw new BadRequestException(
          'Class levels are required for class-level visibility',
        );
      }
    }

    if (dto.visibilityScope === VisibilityScope.SUBJECT) {
      if (!dto.targetSubjectIds || dto.targetSubjectIds.length === 0) {
        throw new BadRequestException(
          'Subjects are required for subject visibility',
        );
      }
    }

    // Validate dates
    const startDate = new Date(dto.startDate);
    if (dto.endDate) {
      const endDate = new Date(dto.endDate);
      if (endDate < startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Check permissions for teachers
    if (creator.role?.name === 'teacher') {
      // Teacher can only create class-level or subject events
      if (dto.visibilityScope === VisibilityScope.SCHOOL_WIDE) {
        throw new ForbiddenException(
          'Teachers cannot create school-wide events',
        );
      }

      // Verify teacher has access to target classes/subjects
      if (dto.targetClassLevelIds) {
        const teacherClasses = await this.classLevelRepository.find({
          where: {
            id: In(dto.targetClassLevelIds),
            teachers: { id: creator.id },
          },
        });

        if (teacherClasses.length !== dto.targetClassLevelIds.length) {
          throw new ForbiddenException(
            'You can only create events for classes you are assigned to',
          );
        }
      }

      if (dto.targetSubjectIds) {
        const teacherSubjects = await this.subjectRepository.find({
          where: {
            id: In(dto.targetSubjectIds),
            teacher: { id: creator.id },
          },
        });

        if (teacherSubjects.length !== dto.targetSubjectIds.length) {
          throw new ForbiddenException(
            'You can only create events for subjects you teach',
          );
        }
      }
    }
    const isTeacher = creator.role?.name === 'teacher';
    const isSchoolAdmin = creator.role?.name === 'school_admin';

    // Create event
    const event = this.eventRepository.create({
      title: dto.title,
      description: dto.description,
      startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      isAllDay: dto.isAllDay ?? false,
      location: dto.location,
      category,
      visibilityScope: dto.visibilityScope,
      school,
      createdByTeacherId: isTeacher ? creator.id : null,
      createdByAdminId: isSchoolAdmin ? creator.id : null,
    });

    // Set target classes/subjects
    if (dto.targetClassLevelIds && dto.targetClassLevelIds.length > 0) {
      event.targetClassLevels = await this.classLevelRepository.findBy({
        id: In(dto.targetClassLevelIds),
      });
    }

    if (dto.targetSubjectIds && dto.targetSubjectIds.length > 0) {
      event.targetSubjects = await this.subjectRepository.findBy({
        id: In(dto.targetSubjectIds),
      });
    }

    const savedEvent = await this.eventRepository.save(event);

    // Handle file attachments
    if (files && files.length > 0) {
      const attachments = await Promise.all(
        files.map(async (file) => {
          try {
            const uploadResult =
              await this.objectStorageService.uploadEventAttachment(
                file,
                schoolId,
                savedEvent.id,
              );

            const attachment = this.attachmentRepository.create({
              event: savedEvent,
              filePath: uploadResult.path,
              fileName: file.originalname,
              fileSize: file.size,
              mediaType: file.mimetype,
            });

            return this.attachmentRepository.save(attachment);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
              `Failed to upload attachment for event ${savedEvent.id}: ${errorMessage}`,
            );
            throw new BadRequestException('Failed to upload attachment');
          }
        }),
      );

      savedEvent.attachments = attachments;
    }

    // Create reminders
    if (dto.reminders && dto.reminders.length > 0) {
      const reminders = dto.reminders.map((reminderDto) =>
        this.reminderRepository.create({
          event: savedEvent,
          reminderTime: new Date(reminderDto.reminderTime),
          notificationType:
            reminderDto.notificationType === 'email'
              ? NotificationType.EMAIL
              : reminderDto.notificationType === 'sms'
                ? NotificationType.SMS
                : NotificationType.BOTH,
        }),
      );

      await this.reminderRepository.save(reminders);
    }

    // Send notifications
    await this.sendEventNotifications(savedEvent, 'created');

    return this.findOneEvent(savedEvent.id, schoolId);
  }

  async findAllEvents(
    schoolId: string,
    filters?: {
      categoryId?: string;
      classLevelId?: string;
      subjectId?: string;
      startDate?: Date;
      endDate?: Date;
      visibilityScope?: VisibilityScope;
    },
  ): Promise<Event[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.category', 'category')
      .leftJoinAndSelect('event.targetClassLevels', 'targetClassLevels')
      .leftJoinAndSelect('event.targetSubjects', 'targetSubjects')
      .leftJoinAndSelect('event.attachments', 'attachments')
      .leftJoinAndSelect('event.reminders', 'reminders')
      .where('event.school.id = :schoolId', { schoolId });

    if (filters?.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters?.classLevelId) {
      queryBuilder.andWhere('targetClassLevels.id = :classLevelId', {
        classLevelId: filters.classLevelId,
      });
    }

    if (filters?.subjectId) {
      queryBuilder.andWhere('targetSubjects.id = :subjectId', {
        subjectId: filters.subjectId,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('event.startDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('event.startDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters?.visibilityScope) {
      queryBuilder.andWhere('event.visibilityScope = :visibilityScope', {
        visibilityScope: filters.visibilityScope,
      });
    }

    return queryBuilder.orderBy('event.startDate', 'ASC').getMany();
  }

  async findEventsForStudent(
    studentId: string,
    filters?: {
      categoryId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<Event[]> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['classLevels', 'school'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const classLevelIds = student.classLevels.map((cl) => cl.id);
    const schoolId = student.school.id;

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.category', 'category')
      .leftJoinAndSelect('event.targetClassLevels', 'targetClassLevels')
      .leftJoinAndSelect('event.targetSubjects', 'targetSubjects')
      .leftJoinAndSelect('event.attachments', 'attachments')
      .where('event.school.id = :schoolId', { schoolId })
      .andWhere(
        '(event.visibilityScope = :schoolWide OR targetClassLevels.id IN (:...classLevelIds))',
        {
          schoolWide: VisibilityScope.SCHOOL_WIDE,
          classLevelIds: classLevelIds.length > 0 ? classLevelIds : [''],
        },
      );

    if (filters?.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('event.startDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('event.startDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    return queryBuilder.orderBy('event.startDate', 'ASC').getMany();
  }

  async findOneEvent(id: string, schoolId: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id, school: { id: schoolId } },
      relations: [
        'category',
        'targetClassLevels',
        'targetSubjects',
        'attachments',
        'reminders',
        'createdByTeacher',
        'createdByAdmin',
      ],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async updateEvent(
    id: string,
    dto: UpdateEventDto,
    updater: SchoolAdmin | Teacher,
  ): Promise<Event> {
    // Get school from updater
    let schoolId: string;

    if (updater.role?.name === 'school_admin') {
      // SchoolAdmin
      schoolId = updater.school.id;
    } else {
      // Teacher - need to fetch with school relation
      const teacherWithSchool = await this.eventRepository.manager
        .getRepository(Teacher)
        .findOne({
          where: { id: updater.id },
          relations: ['school'],
        });

      if (!teacherWithSchool?.school) {
        throw new NotFoundException('Teacher school not found');
      }

      schoolId = teacherWithSchool.school.id;
    }

    const event = await this.findOneEvent(id, schoolId);

    // Check permissions
    if (updater.role?.name === 'teacher') {
      // Teacher can only update events they created
      if (event.createdByTeacherId !== updater.id) {
        throw new ForbiddenException('You can only update events you created');
      }

      // Teacher cannot change to school-wide
      if (
        dto.visibilityScope === VisibilityScope.SCHOOL_WIDE ||
        event.visibilityScope === VisibilityScope.SCHOOL_WIDE
      ) {
        throw new ForbiddenException(
          'Teachers cannot modify school-wide events',
        );
      }
    }

    // Update category if provided
    if (dto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId, school: { id: schoolId } },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      event.category = category;
    }

    // Update basic fields
    if (dto.title !== undefined) event.title = dto.title;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.startDate) event.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) {
      event.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }
    if (dto.isAllDay !== undefined) event.isAllDay = dto.isAllDay;
    if (dto.location !== undefined) event.location = dto.location;
    if (dto.visibilityScope) event.visibilityScope = dto.visibilityScope;

    // Update target classes/subjects
    if (dto.targetClassLevelIds) {
      event.targetClassLevels = await this.classLevelRepository.findBy({
        id: In(dto.targetClassLevelIds),
      });
    }

    if (dto.targetSubjectIds) {
      event.targetSubjects = await this.subjectRepository.findBy({
        id: In(dto.targetSubjectIds),
      });
    }

    const updatedEvent = await this.eventRepository.save(event);

    // Send update notifications
    await this.sendEventNotifications(updatedEvent, 'updated');

    return this.findOneEvent(updatedEvent.id, schoolId);
  }

  async removeEvent(id: string, deleter: SchoolAdmin | Teacher): Promise<void> {
    // Get school from deleter
    let schoolId: string;

    if (deleter.role?.name === 'school_admin') {
      // SchoolAdmin
      schoolId = deleter.school.id;
    } else {
      // Teacher - need to fetch with school relation
      const teacherWithSchool = await this.eventRepository.manager
        .getRepository(Teacher)
        .findOne({
          where: { id: deleter.id },
          relations: ['school'],
        });

      if (!teacherWithSchool?.school) {
        throw new NotFoundException('Teacher school not found');
      }

      schoolId = teacherWithSchool.school.id;
    }

    const event = await this.findOneEvent(id, schoolId);

    // Check permissions
    if (deleter.role?.name === 'teacher') {
      if (event.createdByTeacherId !== deleter.id) {
        throw new ForbiddenException('You can only delete events you created');
      }
    }

    await this.eventRepository.remove(event);
  }

  // Notification methods
  private async sendEventNotifications(
    event: Event,
    action: 'created' | 'updated',
  ): Promise<void> {
    try {
      const recipients = await this.getEventRecipients(event);

      const actionText = action === 'created' ? 'created' : 'updated';
      const subject = `Event ${actionText}: ${event.title}`;
      const message = this.buildEventNotificationMessage(event, action);

      const emailPromises: Promise<void>[] = [];
      const smsPromises: Promise<void>[] = [];

      for (const recipient of recipients) {
        if (recipient.email) {
          emailPromises.push(
            this.emailService
              .sendNotificationEmail(recipient.email, subject, {
                name: recipient.name,
                message,
              })
              .catch((error) => {
                this.logger.error(
                  `Failed to send email to ${recipient.email}: ${error}`,
                );
              }),
          );
        }

        if (recipient.phone) {
          smsPromises.push(
            this.smsService
              .sendNotificationSms(recipient.phone, recipient.name, message)
              .catch((error) => {
                this.logger.error(
                  `Failed to send SMS to ${recipient.phone}: ${error}`,
                );
              }),
          );
        }
      }

      await Promise.allSettled([...emailPromises, ...smsPromises]);
    } catch (error) {
      this.logger.error(`Failed to send event notifications: ${error}`, error);
    }
  }

  private async getEventRecipients(event: Event): Promise<
    Array<{
      email?: string;
      phone?: string;
      name: string;
    }>
  > {
    const recipients: Array<{
      email?: string;
      phone?: string;
      name: string;
    }> = [];

    if (event.visibilityScope === VisibilityScope.SCHOOL_WIDE) {
      // Get all students and parents in the school
      const students = await this.studentRepository.find({
        where: { school: { id: event.school.id } },
        relations: ['parents', 'profile'],
      });

      for (const student of students) {
        // Add student if they have email/phone
        if (student.email) {
          recipients.push({
            email: student.email,
            name: `${student.firstName} ${student.lastName}`,
          });
        }

        // Add parents
        if (student.parents) {
          for (const parent of student.parents) {
            if (parent.email || parent.phone) {
              recipients.push({
                email: parent.email,
                phone: parent.phone,
                name: `${parent.firstName} ${parent.lastName}`,
              });
            }
          }
        }
      }
    } else if (event.visibilityScope === VisibilityScope.CLASS_LEVEL) {
      // Get students in target classes
      const classLevelIds = event.targetClassLevels.map((cl) => cl.id);
      const students = await this.studentRepository.find({
        where: {
          classLevels: { id: In(classLevelIds) },
        },
        relations: ['parents', 'profile'],
      });

      for (const student of students) {
        if (student.email) {
          recipients.push({
            email: student.email,
            name: `${student.firstName} ${student.lastName}`,
          });
        }

        if (student.parents) {
          for (const parent of student.parents) {
            if (parent.email || parent.phone) {
              recipients.push({
                email: parent.email,
                phone: parent.phone,
                name: `${parent.firstName} ${parent.lastName}`,
              });
            }
          }
        }
      }
    } else if (event.visibilityScope === VisibilityScope.SUBJECT) {
      // Get students in classes that have the target subjects
      const subjectIds = event.targetSubjects.map((s) => s.id);
      const subjects = await this.subjectRepository.find({
        where: { id: In(subjectIds) },
        relations: ['classLevels', 'classLevels.students'],
      });

      const studentIds = new Set<string>();
      for (const subject of subjects) {
        for (const classLevel of subject.classLevels) {
          if (classLevel.students) {
            for (const student of classLevel.students) {
              studentIds.add(student.id);
            }
          }
        }
      }

      const students = await this.studentRepository.find({
        where: { id: In(Array.from(studentIds)) },
        relations: ['parents', 'profile'],
      });

      for (const student of students) {
        if (student.email) {
          recipients.push({
            email: student.email,
            name: `${student.firstName} ${student.lastName}`,
          });
        }

        if (student.parents) {
          for (const parent of student.parents) {
            if (parent.email || parent.phone) {
              recipients.push({
                email: parent.email,
                phone: parent.phone,
                name: `${parent.firstName} ${parent.lastName}`,
              });
            }
          }
        }
      }
    }

    // Remove duplicates based on email/phone
    const uniqueRecipients = new Map<string, (typeof recipients)[0]>();
    for (const recipient of recipients) {
      const key = recipient.email || recipient.phone || '';
      if (key && !uniqueRecipients.has(key)) {
        uniqueRecipients.set(key, recipient);
      }
    }

    return Array.from(uniqueRecipients.values());
  }

  private buildEventNotificationMessage(
    event: Event,
    action: 'created' | 'updated',
  ): string {
    const actionText =
      action === 'created'
        ? 'A new event has been created'
        : 'An event has been updated';
    const dateStr = event.isAllDay
      ? new Date(event.startDate).toLocaleDateString()
      : new Date(event.startDate).toLocaleString();

    let message = `${actionText}:\n\n`;
    message += `Title: ${event.title}\n`;
    if (event.description) {
      message += `Description: ${event.description}\n`;
    }
    message += `Date: ${dateStr}\n`;
    if (event.location) {
      message += `Location: ${event.location}\n`;
    }
    message += `Category: ${event.category.name}\n`;

    return message;
  }
}
