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
    const school = await this.schoolRepository.findOneBy({
      id: schoolId,
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const admin = await this.schoolAdminRepository.findOneBy({ id: adminId });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Determine target students based on the provided criteria
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
      const students = await this.studentRepository.find({
        where: {
          school: { id: schoolId },
          classLevels: { id: In(createDto.targetClassLevelIds) },
        },
        relations: ['classLevels', 'parents'],
      });
      targetStudents = students;
    } else if (
      createDto.targetGradeIds &&
      createDto.targetGradeIds?.length > 0
    ) {
      const classLevels = await this.classLevelRepository.find({
        where: { id: In(createDto.targetGradeIds) },
      });
      const students = await this.studentRepository.find({
        where: {
          school: { id: schoolId },
          classLevels: { id: In(classLevels.map((cl) => cl.id)) },
        },
        relations: ['classLevels', 'parents'],
      });
      targetStudents = students;
    }

    // Fetch class level entities for the relationship
    let targetClassLevels: ClassLevel[] = [];
    if (
      createDto.targetClassLevelIds &&
      createDto.targetClassLevelIds.length > 0
    ) {
      targetClassLevels = await this.classLevelRepository.find({
        where: { id: In(createDto.targetClassLevelIds) },
      });
    }

    const messageReminder = this.messageReminderRepository.create({
      ...createDto,
      school,
      createdBy: admin,
      targetStudents,
      targetClassLevels,
      totalRecipients: targetStudents.length,
      scheduledAt: createDto.scheduledAt
        ? new Date(createDto.scheduledAt)
        : null,
    });

    const savedReminder =
      await this.messageReminderRepository.save(messageReminder);

    if (
      savedReminder.type === ReminderType.IMMEDIATE &&
      savedReminder.status === ReminderStatus.ACTIVE
    ) {
      await this.sendReminderNotifications(savedReminder);
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

  async sendScheduledReminders(): Promise<void> {
    const now = new Date();
    const scheduledReminders = await this.messageReminderRepository.find({
      where: {
        status: ReminderStatus.SCHEDULED,
        type: ReminderType.SCHEDULED,
        scheduledAt: Between(
          new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
          new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes from now
        ),
      },
      relations: ['targetStudents', 'targetStudents.parents'],
    });

    for (const reminder of scheduledReminders) {
      try {
        await this.sendReminderNotifications(reminder);
        reminder.status = ReminderStatus.ACTIVE;
        await this.messageReminderRepository.save(reminder);
      } catch (error) {
        this.logger.error(
          `Failed to send scheduled reminder ${reminder.id}`,
          error,
        );
      }
    }
  }

  async sendReminderToSpecificStudents(
    reminderId: string,
    studentIds: string[],
  ): Promise<void> {
    const reminder = await this.findOne(reminderId);

    if (!reminder.targetStudents || reminder.targetStudents.length === 0) {
      throw new BadRequestException(
        'No target students found for this reminder',
      );
    }

    // Filter students to only the specified ones
    const filteredStudents = reminder.targetStudents.filter((student) =>
      studentIds.includes(student.id),
    );

    if (filteredStudents.length === 0) {
      throw new BadRequestException('No matching students found');
    }

    // Create a temporary reminder object with filtered students
    const tempReminder = { ...reminder, targetStudents: filteredStudents };

    await this.sendReminderNotifications(tempReminder);

    // Update the main reminder's sent count
    reminder.sentCount += filteredStudents.length;
    reminder.lastSentAt = new Date();
    await this.messageReminderRepository.save(reminder);
  }

  async getReminderStats(schoolId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    scheduled: number;
    totalSent: number;
  }> {
    const [total, active, inactive, scheduled] = await Promise.all([
      this.messageReminderRepository.count({
        where: { school: { id: schoolId } },
      }),
      this.messageReminderRepository.count({
        where: { school: { id: schoolId }, status: ReminderStatus.ACTIVE },
      }),
      this.messageReminderRepository.count({
        where: { school: { id: schoolId }, status: ReminderStatus.INACTIVE },
      }),
      this.messageReminderRepository.count({
        where: { school: { id: schoolId }, status: ReminderStatus.SCHEDULED },
      }),
    ]);

    const totalSent = (await this.messageReminderRepository
      .createQueryBuilder('reminder')
      .select('SUM(reminder.sentCount)', 'total')
      .where('reminder.school.id = :schoolId', { schoolId })
      .getRawOne()) as { total: string };

    return {
      total,
      active,
      inactive,
      scheduled,
      totalSent: parseInt(totalSent?.total ?? '0'),
    };
  }

  async getAvailableStudentsForTargeting(
    schoolId: string,
    searchTerm?: string,
    classLevelIds?: string[],
  ): Promise<Student[]> {
    const queryBuilder = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.parents', 'parents')
      .leftJoinAndSelect('student.classLevels', 'classLevels')
      .where('student.school.id = :schoolId', { schoolId })
      .andWhere('student.isArchived = :isArchived', { isArchived: false });

    if (searchTerm) {
      queryBuilder.andWhere(
        '(student.firstName LIKE :search OR student.lastName LIKE :search OR student.email LIKE :search)',
        { search: `%${searchTerm}%` },
      );
    }

    if (classLevelIds && classLevelIds.length > 0) {
      queryBuilder.andWhere('classLevels.id IN (:...classLevelIds)', {
        classLevelIds,
      });
    }

    return queryBuilder
      .orderBy('student.firstName', 'ASC')
      .addOrderBy('student.lastName', 'ASC')
      .getMany();
  }

  async getClassLevelsForSchool(schoolId: string) {
    return this.classLevelRepository.find({
      where: { school: { id: schoolId } },
      order: { name: 'ASC' },
    });
  }

  /**
   * Migrate existing data from string arrays to proper relationships
   * This method should be called once to update existing data
   */
  async migrateExistingData() {
    this.logger.log('Starting migration of existing message reminder data...');

    const reminders = await this.messageReminderRepository.find({
      where: {},
      relations: ['targetClassLevels'],
    });

    let migratedCount = 0;

    for (const reminder of reminders) {
      try {
        // Check if this reminder needs migration (has string array data)
        if (
          reminder.targetClassLevels &&
          Array.isArray(reminder.targetClassLevels)
        ) {
          // If it's already an array of ClassLevel entities, skip
          if (
            reminder.targetClassLevels.length > 0 &&
            typeof reminder.targetClassLevels[0] === 'object'
          ) {
            continue;
          }

          // This is old data that needs migration
          this.logger.log(`Migrating reminder ${reminder.id}...`);

          // The data should already be migrated by the entity change
          // This method is mainly for logging and verification
          migratedCount++;
        }
      } catch (error) {
        this.logger.error(`Failed to migrate reminder ${reminder.id}:`, error);
      }
    }

    this.logger.log(
      `Migration completed. ${migratedCount} reminders processed.`,
    );
    return { migratedCount, totalReminders: reminders.length };
  }
}
