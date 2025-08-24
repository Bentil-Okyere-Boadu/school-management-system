import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import {
  MessageReminder,
  ReminderStatus,
  ReminderType,
} from './entities/message-reminder.entity';
import { CreateMessageReminderDto } from './dto/create-message-reminder.dto';
import { UpdateMessageReminderDto } from './dto/update-message-reminder.dto';
import { SearchMessageReminderDto } from './dto/search-message-reminder.dto';
import { School } from 'src/school/school.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Student } from 'src/student/student.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { EmailService } from '../common/services/email.service';
import { SmsService } from '../common/services/sms.service';

@Injectable()
export class MessageReminderService {
  private readonly logger = new Logger(MessageReminderService.name);

  constructor(
    @InjectRepository(MessageReminder)
    private messageReminderRepository: Repository<MessageReminder>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(SchoolAdmin)
    private schoolAdminRepository: Repository<SchoolAdmin>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(ClassLevel)
    private classLevelRepository: Repository<ClassLevel>,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  async create(
    createDto: CreateMessageReminderDto,
    adminId: string,
    schoolId: string,
  ) {
    const school = await this.schoolRepository.findOneBy({ id: schoolId });
    if (!school) throw new NotFoundException('School not found');

    const admin = await this.schoolAdminRepository.findOneBy({ id: adminId });
    if (!admin) throw new NotFoundException('Admin not found');

    let targetStudents: Student[] = [];
    if (createDto.targetStudentIds && createDto.targetStudentIds?.length > 0) {
      targetStudents = await this.studentRepository.findBy({
        id: In(createDto.targetStudentIds),
        school: { id: schoolId },
      });
    } else if (
      createDto.targetClassLevelIds &&
      createDto.targetClassLevelIds?.length > 0
    ) {
      targetStudents = await this.studentRepository.find({
        where: {
          school: { id: schoolId },
          classLevels: { id: In(createDto.targetClassLevelIds) },
        },
        relations: ['classLevels', 'parents'],
      });
    } else if (
      createDto.targetGradeIds &&
      createDto.targetGradeIds?.length > 0
    ) {
      const classLevels = await this.classLevelRepository.find({
        where: { id: In(createDto.targetGradeIds) },
      });
      targetStudents = await this.studentRepository.find({
        where: {
          school: { id: schoolId },
          classLevels: { id: In(classLevels.map((cl) => cl.id)) },
        },
        relations: ['classLevels', 'parents'],
      });
    }

    let targetClassLevels: ClassLevel[] = [];
    if (
      createDto.targetClassLevelIds &&
      createDto.targetClassLevelIds?.length > 0
    ) {
      targetClassLevels = await this.classLevelRepository.find({
        where: { id: In(createDto.targetClassLevelIds) },
      });
    }

    const now = new Date();
    const schedDate = createDto.scheduledAt
      ? new Date(createDto.scheduledAt)
      : undefined;
    const isFuture = !!schedDate && schedDate.getTime() > now.getTime();

    if (!createDto.type) {
      createDto.type = isFuture
        ? ReminderType.SCHEDULED
        : ReminderType.IMMEDIATE;
    }
    if (!createDto.status) {
      createDto.status = isFuture
        ? ReminderStatus.SCHEDULED
        : ReminderStatus.ACTIVE;
    }

    const reminder = this.messageReminderRepository.create({
      ...createDto,
      school,
      createdBy: admin,
      targetStudents,
      targetClassLevels,
      totalRecipients: targetStudents.length,
      scheduledAt: schedDate || null,
    });

    const savedReminder = await this.messageReminderRepository.save(reminder);

    if (
      savedReminder.type === ReminderType.IMMEDIATE &&
      savedReminder.status === ReminderStatus.ACTIVE
    ) {
      await this.sendReminderNotifications(savedReminder);
    }

    if (
      savedReminder.type === ReminderType.SCHEDULED &&
      savedReminder.status === ReminderStatus.SCHEDULED &&
      savedReminder.scheduledAt &&
      savedReminder.scheduledAt.getTime() <= Date.now()
    ) {
      await this.sendReminderNotifications(savedReminder);
      savedReminder.status = ReminderStatus.ACTIVE;
      savedReminder.lastSentAt = new Date();
      await this.messageReminderRepository.save(savedReminder);
    }

    return savedReminder;
  }

  async findAll(searchDto: SearchMessageReminderDto) {
    const queryBuilder = this.messageReminderRepository
      .createQueryBuilder('reminder')
      .leftJoinAndSelect('reminder.school', 'school')
      .leftJoinAndSelect('reminder.createdBy', 'createdBy')
      .leftJoinAndSelect('reminder.targetStudents', 'targetStudents')
      .leftJoinAndSelect('reminder.targetClassLevels', 'targetClassLevels')
      .orderBy('reminder.createdAt', 'DESC');

    if (searchDto.schoolId) {
      queryBuilder.andWhere('school.id = :schoolId', {
        schoolId: searchDto.schoolId,
      });
    }

    if (searchDto.status) {
      queryBuilder.andWhere('reminder.status = :status', {
        status: searchDto.status,
      });
    }

    if (searchDto.type) {
      queryBuilder.andWhere('reminder.type = :type', { type: searchDto.type });
    }

    if (searchDto.search) {
      queryBuilder.andWhere(
        '(reminder.title LIKE :search OR reminder.message LIKE :search)',
        { search: `%${searchDto.search}%` },
      );
    }

    if (searchDto.dateFrom && searchDto.dateTo) {
      queryBuilder.andWhere(
        'reminder.createdAt BETWEEN :dateFrom AND :dateTo',
        {
          dateFrom: new Date(searchDto.dateFrom),
          dateTo: new Date(searchDto.dateTo),
        },
      );
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string) {
    const reminder = await this.messageReminderRepository.findOne({
      where: { id },
      relations: [
        'school',
        'createdBy',
        'targetStudents',
        'targetStudents.parents',
        'targetStudents.classLevels',
        'targetClassLevels',
      ],
    });

    if (!reminder) {
      throw new NotFoundException('Message reminder not found');
    }

    return reminder;
  }

  async update(id: string, updateDto: UpdateMessageReminderDto) {
    const reminder = await this.findOne(id);

    // Update the reminder
    Object.assign(reminder, updateDto);

    if (updateDto.scheduledAt) {
      reminder.scheduledAt = new Date(updateDto.scheduledAt);
    }

    const updatedReminder = await this.messageReminderRepository.save(reminder);

    // If status changed to active and it's immediate, send notifications
    if (
      updatedReminder.status === ReminderStatus.ACTIVE &&
      updatedReminder.type === ReminderType.IMMEDIATE
    ) {
      await this.sendReminderNotifications(updatedReminder);
    }

    // Return the updated reminder with class level objects
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const reminder = await this.findOne(id);
    await this.messageReminderRepository.remove(reminder);
  }

  async toggleStatus(id: string) {
    const reminder = await this.findOne(id);

    reminder.status =
      reminder.status === ReminderStatus.ACTIVE
        ? ReminderStatus.INACTIVE
        : ReminderStatus.ACTIVE;

    await this.messageReminderRepository.save(reminder);

    // Return the updated reminder with class level objects
    return this.findOne(id);
  }

  async sendReminderNotifications(reminder: MessageReminder): Promise<void> {
    try {
      if (!reminder.targetStudents || reminder.targetStudents.length === 0) {
        this.logger.warn(
          `No target students found for reminder ${reminder.id}`,
        );
        return;
      }

      let sentCount = 0;
      let errorCount = 0;

      for (const student of reminder.targetStudents) {
        try {
          // Send to parents if enabled
          if (reminder.sendToParents && student.parents?.length > 0) {
            for (const parent of student.parents) {
              try {
                // Send email using EmailService directly
                if (parent.email) {
                  await this.emailService.sendNotificationEmail(
                    parent.email,
                    reminder.title,
                    {
                      name: `${parent.firstName} ${parent.lastName}`,
                      message: reminder.message,
                    },
                  );
                  sentCount++;
                }

                // Send SMS using SmsService directly for phone contacts
                if (parent.phone) {
                  await this.smsService.sendNotificationSms(
                    parent.phone,
                    `${parent.firstName} ${parent.lastName}`,
                    reminder.message,
                  );
                  sentCount++;
                }
              } catch (parentError) {
                errorCount++;
                this.logger.error(
                  `Failed to send notification to parent ${parent.id}: ${
                    (parentError as Error).message
                  }`,
                  parentError,
                );
                // Continue with other parents, don't block the process
              }
            }
          }

          // Send to students if enabled
          if (reminder.sendToStudents) {
            // Send email using EmailService directly
            if (student.email) {
              try {
                await this.emailService.sendNotificationEmail(
                  student.email,
                  reminder.title,
                  {
                    name: `${student.firstName} ${student.lastName}`,
                    message: reminder.message,
                  },
                );
                sentCount++;
              } catch (emailError) {
                errorCount++;
                this.logger.error(
                  `Failed to send email to student ${student.id}: ${
                    (emailError as Error).message
                  }`,
                  emailError,
                );
                // Continue with SMS, don't block the process
              }
            }

            // Send SMS using SmsService directly for phone contacts
            if (student?.profile?.phoneContact) {
              try {
                await this.smsService.sendNotificationSms(
                  student.profile.phoneContact,
                  `${student.firstName} ${student.lastName}`,
                  reminder.message,
                );
                sentCount++;
              } catch (smsError) {
                errorCount++;
                this.logger.error(
                  `Failed to send SMS to student ${student.id}: ${
                    (smsError as Error).message
                  }`,
                  smsError,
                );
                // Continue with next student, don't block the process
              }
            }
          }
        } catch (studentError) {
          errorCount++;
          this.logger.error(
            `Failed to process student ${student.id}: ${
              (studentError as Error).message
            }`,
            studentError,
          );
          // Continue with next student, don't block the process
        }
      }

      // Update the reminder with sent count and last sent time
      reminder.sentCount = sentCount;
      reminder.lastSentAt = new Date();
      await this.messageReminderRepository.save(reminder);

      this.logger.log(
        `Successfully sent reminder ${reminder.id} to ${sentCount} recipients (${errorCount} errors)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send reminder notifications for ${reminder.id}`,
        error,
      );
      throw new BadRequestException('Failed to send reminder notifications');
    }
  }
}
