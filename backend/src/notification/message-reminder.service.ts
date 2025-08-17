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
import { NotificationService } from '../common/services/notification.service';

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
    private notificationService: NotificationService,
  ) {}

  async create(
    createDto: CreateMessageReminderDto,
    adminId: string,
    schoolId: string,
  ): Promise<MessageReminder> {
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

    const messageReminder = this.messageReminderRepository.create({
      ...createDto,
      school,
      createdBy: admin,
      targetStudents,
      targetClassLevels: createDto.targetClassLevelIds,
      targetGrades: createDto.targetGradeIds,
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

  async findAll(
    searchDto: SearchMessageReminderDto,
  ): Promise<MessageReminder[]> {
    const queryBuilder = this.messageReminderRepository
      .createQueryBuilder('reminder')
      .leftJoinAndSelect('reminder.school', 'school')
      .leftJoinAndSelect('reminder.createdBy', 'createdBy')
      .leftJoinAndSelect('reminder.targetStudents', 'targetStudents')
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

  async findOne(id: string): Promise<MessageReminder> {
    const reminder = await this.messageReminderRepository.findOne({
      where: { id },
      relations: [
        'school',
        'createdBy',
        'targetStudents',
        'targetStudents.parents',
      ],
    });

    if (!reminder) {
      throw new NotFoundException('Message reminder not found');
    }

    return reminder;
  }

  async update(
    id: string,
    updateDto: UpdateMessageReminderDto,
  ): Promise<MessageReminder> {
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

    return updatedReminder;
  }

  async remove(id: string): Promise<void> {
    const reminder = await this.findOne(id);
    await this.messageReminderRepository.remove(reminder);
  }

  async toggleStatus(id: string): Promise<MessageReminder> {
    const reminder = await this.findOne(id);

    reminder.status =
      reminder.status === ReminderStatus.ACTIVE
        ? ReminderStatus.INACTIVE
        : ReminderStatus.ACTIVE;

    return this.messageReminderRepository.save(reminder);
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

      for (const student of reminder.targetStudents) {
        try {
          // Send to parents if enabled
          if (reminder.sendToParents && student.parents?.length > 0) {
            for (const parent of student.parents) {
              if (parent.email) {
                await this.notificationService.sendCustomNotification(
                  parent.email,
                  parent.phone,
                  `${parent.firstName} ${parent.lastName}`,
                  reminder.title,
                  reminder.message,
                );
                sentCount++;
              }
            }
          }

          // Send to students if enabled
          if (reminder.sendToStudents && student?.profile?.phoneContact) {
            await this.notificationService.sendCustomNotification(
              student.email,
              student?.profile?.phoneContact,
              `${student.firstName} ${student.lastName}`,
              reminder.title,
              reminder.message,
            );
            sentCount++;
          }
        } catch (error) {
          this.logger.error(
            `Failed to send reminder notification to student ${student.id}`,
            error,
          );
        }
      }

      // Update the reminder with sent count and last sent time
      reminder.sentCount = sentCount;
      reminder.lastSentAt = new Date();
      await this.messageReminderRepository.save(reminder);

      this.logger.log(
        `Successfully sent reminder ${reminder.id} to ${sentCount} recipients`,
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
}
