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
import { SubjectCatalog } from '../subject/subject-catalog.entity';
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
    @InjectRepository(SubjectCatalog)
    private subjectCatalogRepository: Repository<SubjectCatalog>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    private objectStorageService: ObjectStorageServiceService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

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
    const { school, schoolId } = await this.getSchoolFromUser(creator);

    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId, school: { id: schoolId } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    this.validateVisibilityScope(dto);

    const startDate = new Date(dto.startDate);
    if (dto.endDate) {
      const endDate = new Date(dto.endDate);
      if (endDate < startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    if (creator.role?.name === 'teacher') {
      await this.validateTeacherPermissions(creator as Teacher, dto);
    }

    const isTeacher = creator.role?.name === 'teacher';
    const isSchoolAdmin = creator.role?.name === 'school_admin';

    const event = this.eventRepository.create({
      title: dto.title,
      description: dto.description,
      startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      isAllDay: dto.isAllDay ?? false,
      sendNotifications: dto.sendNotifications !== false,
      location: dto.location,
      category,
      visibilityScope: dto.visibilityScope,
      school,
      createdByTeacherId: isTeacher ? creator.id : null,
      createdByAdminId: isSchoolAdmin ? creator.id : null,
    });

    await this.setEventTargets(event, dto);

    const savedEvent = await this.eventRepository.save(event);

    if (files && files.length > 0) {
      savedEvent.attachments = await this.uploadEventAttachments(
        files,
        savedEvent,
        schoolId,
      );
    }

    if (dto.reminders && dto.reminders.length > 0) {
      await this.createEventReminders(savedEvent, dto.reminders);
    }

    const shouldSendNotifications = dto.sendNotifications !== false;

    if (shouldSendNotifications) {
      const eventForNotifications = await this.loadEventForNotifications(
        savedEvent.id,
      );

      if (eventForNotifications) {
        await this.sendEventNotifications(eventForNotifications, 'created');
      }
    }

    return this.findOneEvent(savedEvent.id, schoolId);
  }

  private async getSchoolFromUser(
    user: SchoolAdmin | Teacher,
  ): Promise<{ school: School; schoolId: string }> {
    if (user.role?.name === 'school_admin') {
      return { school: user.school, schoolId: user.school.id };
    }

    const teacherWithSchool = await this.eventRepository.manager
      .getRepository(Teacher)
      .findOne({
        where: { id: user.id },
        relations: ['school'],
      });

    if (!teacherWithSchool?.school) {
      throw new NotFoundException('Teacher school not found');
    }

    return {
      school: teacherWithSchool.school,
      schoolId: teacherWithSchool.school.id,
    };
  }

  private validateVisibilityScope(dto: CreateEventDto | UpdateEventDto): void {
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
          'Subject catalogs are required for subject visibility',
        );
      }
    }
  }

  private async validateTeacherPermissions(
    creator: Teacher,
    dto: CreateEventDto | UpdateEventDto,
  ): Promise<void> {
    if (dto.visibilityScope === VisibilityScope.SCHOOL_WIDE) {
      throw new ForbiddenException('Teachers cannot create school-wide events');
    }

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
          subjectCatalog: { id: In(dto.targetSubjectIds) },
          teacher: { id: creator.id },
        },
        relations: ['subjectCatalog'],
      });

      const teacherSubjectCatalogIds = new Set(
        teacherSubjects
          .map((s) => s.subjectCatalog?.id)
          .filter((id): id is string => id !== undefined),
      );

      const requestedCatalogIds = new Set(dto.targetSubjectIds);
      const allTaught = Array.from(requestedCatalogIds).every((id) =>
        teacherSubjectCatalogIds.has(id),
      );

      if (!allTaught) {
        throw new ForbiddenException(
          'You can only create events for subject catalogs you teach',
        );
      }
    }
  }

  private async setEventTargets(
    event: Event,
    dto: CreateEventDto | UpdateEventDto,
  ): Promise<void> {
    if (dto.targetClassLevelIds && dto.targetClassLevelIds.length > 0) {
      event.targetClassLevels = await this.classLevelRepository.findBy({
        id: In(dto.targetClassLevelIds),
      });
    }

    if (dto.targetSubjectIds && dto.targetSubjectIds.length > 0) {
      event.targetSubjects = await this.subjectCatalogRepository.findBy({
        id: In(dto.targetSubjectIds),
      });
    }
  }

  private async uploadEventAttachments(
    files: Express.Multer.File[],
    event: Event,
    schoolId: string,
  ): Promise<EventAttachment[]> {
    return Promise.all(
      files.map(async (file) => {
        try {
          const uploadResult =
            await this.objectStorageService.uploadEventAttachment(
              file,
              schoolId,
              event.id,
            );

          const attachment = this.attachmentRepository.create({
            event,
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
            `Failed to upload attachment for event ${event.id}: ${errorMessage}`,
          );
          throw new BadRequestException('Failed to upload attachment');
        }
      }),
    );
  }

  private async createEventReminders(
    event: Event,
    reminders: Array<{
      reminderTime: string;
      notificationType?: 'email' | 'sms' | 'both';
    }>,
  ): Promise<void> {
    const reminderEntities = reminders.map((reminderDto) =>
      this.reminderRepository.create({
        event,
        reminderTime: new Date(reminderDto.reminderTime),
        notificationType:
          reminderDto.notificationType === 'email'
            ? NotificationType.EMAIL
            : reminderDto.notificationType === 'sms'
              ? NotificationType.SMS
              : NotificationType.BOTH,
      }),
    );

    await this.reminderRepository.save(reminderEntities);
  }

  private async loadEventForNotifications(
    eventId: string,
  ): Promise<Event | null> {
    return this.eventRepository.findOne({
      where: { id: eventId },
      relations: [
        'category',
        'targetSubjects',
        'targetClassLevels',
        'targetClassLevels.students',
        'school',
      ],
    });
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

    const events = await queryBuilder
      .orderBy('event.startDate', 'ASC')
      .getMany();

    await Promise.all(
      events.map((event) => this.enrichAttachmentsWithSignedUrls(event)),
    );

    return events;
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
      relations: ['classLevels', 'school', 'classLevels.subjects'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const classLevelIds = student.classLevels.map((cl) => cl.id);
    const schoolId = student.school.id;

    const studentSubjectCatalogIds =
      await this.getStudentSubjectCatalogIds(classLevelIds);

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.category', 'category')
      .leftJoinAndSelect('event.targetClassLevels', 'targetClassLevels')
      .leftJoinAndSelect('event.targetSubjects', 'targetSubjects')
      .leftJoinAndSelect('event.attachments', 'attachments')
      .where('event.school.id = :schoolId', { schoolId })
      .leftJoin('targetSubjects.subjectCatalog', 'targetSubjectCatalog')
      .andWhere(
        '(event.visibilityScope = :schoolWide OR targetClassLevels.id IN (:...classLevelIds) OR (event.visibilityScope = :subject AND targetSubjectCatalog.id IN (:...subjectCatalogIds)))',
        {
          schoolWide: VisibilityScope.SCHOOL_WIDE,
          subject: VisibilityScope.SUBJECT,
          classLevelIds: classLevelIds.length > 0 ? classLevelIds : [''],
          subjectCatalogIds:
            Array.from(studentSubjectCatalogIds).length > 0
              ? Array.from(studentSubjectCatalogIds)
              : [''],
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

    const events = await queryBuilder
      .orderBy('event.startDate', 'ASC')
      .getMany();

    await Promise.all(
      events.map((event) => this.enrichAttachmentsWithSignedUrls(event)),
    );

    return events;
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

    await this.enrichAttachmentsWithSignedUrls(event);

    return event;
  }

  private async enrichAttachmentsWithSignedUrls(event: Event): Promise<void> {
    if (event.attachments && event.attachments.length > 0) {
      await Promise.all(
        event.attachments.map(async (attachment) => {
          try {
            const signedUrl = await this.objectStorageService.getSignedUrl(
              attachment.filePath,
              3600,
            );
            Object.assign(attachment, { signedUrl });
          } catch (error) {
            this.logger.error(
              `Failed to generate signed URL for attachment ${attachment.id}: ${error}`,
            );
            Object.assign(attachment, { signedUrl: null });
          }
        }),
      );
    }
  }

  private async getStudentSubjectCatalogIds(
    classLevelIds: string[],
  ): Promise<Set<string>> {
    const catalogIds = new Set<string>();
    if (classLevelIds.length === 0) {
      return catalogIds;
    }

    const subjects = await this.subjectRepository.find({
      where: { classLevels: { id: In(classLevelIds) } },
      relations: ['subjectCatalog'],
    });

    for (const subject of subjects) {
      if (subject.subjectCatalog) {
        catalogIds.add(subject.subjectCatalog.id);
      }
    }

    return catalogIds;
  }

  async updateEvent(
    id: string,
    dto: UpdateEventDto,
    updater: SchoolAdmin | Teacher,
    files?: Express.Multer.File[],
  ): Promise<Event> {
    const { schoolId } = await this.getSchoolFromUser(updater);
    const event = await this.findOneEvent(id, schoolId);

    if (updater.role?.name === 'teacher') {
      if (event.createdByTeacherId !== updater.id) {
        throw new ForbiddenException('You can only update events you created');
      }

      if (
        dto.visibilityScope === VisibilityScope.SCHOOL_WIDE ||
        event.visibilityScope === VisibilityScope.SCHOOL_WIDE
      ) {
        throw new ForbiddenException(
          'Teachers cannot modify school-wide events',
        );
      }
    }

    if (dto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId, school: { id: schoolId } },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      event.category = category;
    }

    if (dto.title !== undefined) {
      event.title = dto.title;
    }
    if (dto.description !== undefined) {
      event.description = dto.description ?? null;
    }
    if (dto.startDate !== undefined && dto.startDate) {
      event.startDate = new Date(dto.startDate);
    }
    if (dto.endDate !== undefined) {
      event.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }
    if (dto.isAllDay !== undefined) {
      event.isAllDay = dto.isAllDay;
    }
    if (dto.sendNotifications !== undefined) {
      event.sendNotifications = Boolean(dto.sendNotifications);
    }
    if (dto.location !== undefined) {
      event.location = dto.location ?? null;
    }
    if (dto.visibilityScope !== undefined) {
      event.visibilityScope = dto.visibilityScope;
    }

    if (dto.targetClassLevelIds !== undefined) {
      if (dto.targetClassLevelIds.length > 0) {
        event.targetClassLevels = await this.classLevelRepository.findBy({
          id: In(dto.targetClassLevelIds),
        });
      } else {
        event.targetClassLevels = [];
      }
    }

    if (dto.targetSubjectIds !== undefined) {
      if (dto.targetSubjectIds.length > 0) {
        event.targetSubjects = await this.subjectCatalogRepository.findBy({
          id: In(dto.targetSubjectIds),
        });
      } else {
        event.targetSubjects = [];
      }
    }

    const updatedEvent = await this.eventRepository.save(event);

    if (files && files.length > 0) {
      const newAttachments = await this.uploadEventAttachments(
        files,
        updatedEvent,
        schoolId,
      );
      updatedEvent.attachments = [
        ...(updatedEvent.attachments || []),
        ...newAttachments,
      ];
      await this.eventRepository.save(updatedEvent);
    }

    const shouldSendNotifications = dto.sendNotifications !== false;

    if (shouldSendNotifications) {
      const eventForNotifications = await this.loadEventForNotifications(
        updatedEvent.id,
      );

      if (eventForNotifications) {
        await this.sendEventNotifications(eventForNotifications, 'updated');
      }
    }

    return this.findOneEvent(updatedEvent.id, schoolId);
  }

  async removeEvent(id: string, deleter: SchoolAdmin | Teacher): Promise<void> {
    const { schoolId } = await this.getSchoolFromUser(deleter);
    const event = await this.findOneEvent(id, schoolId);

    if (deleter.role?.name === 'teacher') {
      if (event.createdByTeacherId !== deleter.id) {
        throw new ForbiddenException('You can only delete events you created');
      }
    }

    await this.eventRepository.remove(event);
  }

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
      const students = await this.studentRepository.find({
        where: { school: { id: event.school.id } },
        relations: ['parents', 'profile'],
      });
      this.addStudentsToRecipients(students, recipients);
    } else if (event.visibilityScope === VisibilityScope.CLASS_LEVEL) {
      const classLevelIds = event.targetClassLevels.map((cl) => cl.id);
      const students = await this.studentRepository.find({
        where: { classLevels: { id: In(classLevelIds) } },
        relations: ['parents', 'profile'],
      });
      this.addStudentsToRecipients(students, recipients);
    } else if (event.visibilityScope === VisibilityScope.SUBJECT) {
      const students = await this.getStudentsForSubjectEvent(event);
      this.addStudentsToRecipients(students, recipients);
    }

    return this.deduplicateRecipients(recipients);
  }

  private addStudentsToRecipients(
    students: Student[],
    recipients: Array<{ email?: string; phone?: string; name: string }>,
  ): void {
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

  private async getStudentsForSubjectEvent(event: Event): Promise<Student[]> {
    if (!event.targetSubjects || event.targetSubjects.length === 0) {
      this.logger.warn(
        `Event ${event.id} has SUBJECT visibility but no target subjects`,
      );
      return [];
    }

    const subjectCatalogIds = event.targetSubjects.map((catalog) => catalog.id);

    const subjectCatalogs = await this.subjectCatalogRepository.find({
      where: { id: In(subjectCatalogIds) },
      relations: [
        'subjects',
        'subjects.classLevels',
        'subjects.classLevels.students',
      ],
    });

    if (subjectCatalogs.length === 0) {
      this.logger.warn(
        `No subject catalogs found for IDs: ${subjectCatalogIds.join(', ')}`,
      );
      return [];
    }

    const studentIds = new Set<string>();
    for (const catalog of subjectCatalogs) {
      if (!catalog.subjects || catalog.subjects.length === 0) {
        continue;
      }

      for (const subject of catalog.subjects) {
        if (!subject.classLevels || subject.classLevels.length === 0) {
          continue;
        }

        for (const classLevel of subject.classLevels) {
          if (classLevel.students && classLevel.students.length > 0) {
            for (const student of classLevel.students) {
              studentIds.add(student.id);
            }
          }
        }
      }
    }

    if (studentIds.size === 0) {
      this.logger.warn(`No students found for subject-based event ${event.id}`);
      return [];
    }

    return this.studentRepository.find({
      where: { id: In(Array.from(studentIds)) },
      relations: ['parents', 'profile'],
    });
  }

  private deduplicateRecipients(
    recipients: Array<{ email?: string; phone?: string; name: string }>,
  ): Array<{ email?: string; phone?: string; name: string }> {
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
    if (event.category?.name) {
      message += `Category: ${event.category.name}\n`;
    }

    return message;
  }
}
