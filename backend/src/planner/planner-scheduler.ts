import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import {
  EventReminder,
  NotificationType,
} from './entities/event-reminder.entity';
import { Event } from './entities/event.entity';
import { PlannerService } from './planner.service';
import { EmailService } from '../common/services/email.service';
import { SmsService } from '../common/services/sms.service';
import { Student } from '../student/student.entity';
import { Parent } from '../parent/parent.entity';
import { Subject } from '../subject/subject.entity';
import { SubjectCatalog } from '../subject/subject-catalog.entity';
import { In } from 'typeorm';
import { VisibilityScope } from './entities/event.entity';

@Injectable()
export class PlannerScheduler {
  private readonly logger = new Logger(PlannerScheduler.name);
  private running = false;

  constructor(
    @InjectRepository(EventReminder)
    private readonly reminderRepository: Repository<EventReminder>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(SubjectCatalog)
    private readonly subjectCatalogRepository: Repository<SubjectCatalog>,
    private readonly plannerService: PlannerService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  @Cron(process.env.EVENT_REMINDER_CRON ?? '0 * * * * *')
  async checkEventReminders() {
    if (this.running) return;
    this.running = true;

    try {
      const now = new Date();
      const dueReminders = await this.reminderRepository.find({
        where: {
          reminderTime: LessThanOrEqual(now),
          sent: false,
        },
        relations: [
          'event',
          'event.category',
          'event.school',
          'event.targetClassLevels',
          'event.targetSubjects',
        ],
        take: 50,
      });

      for (const reminder of dueReminders) {
        try {
          await this.sendReminder(reminder);
          reminder.sent = true;
          await this.reminderRepository.save(reminder);
          this.logger.log(
            `Sent event reminder ${reminder.id} for event ${reminder.event.id}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send reminder ${reminder.id}: ${(error as Error).message}`,
            error,
          );
        }
      }
    } finally {
      this.running = false;
    }
  }

  private async sendReminder(reminder: EventReminder): Promise<void> {
    const event = reminder.event;
    const recipients = await this.getReminderRecipients(event);

    const subject = `Reminder: ${event.title}`;
    const message = this.buildReminderMessage(event);

    const emailPromises: Promise<void>[] = [];
    const smsPromises: Promise<void>[] = [];

    for (const recipient of recipients) {
      const shouldSendEmail =
        reminder.notificationType === NotificationType.EMAIL ||
        reminder.notificationType === NotificationType.BOTH;
      const shouldSendSms =
        reminder.notificationType === NotificationType.SMS ||
        reminder.notificationType === NotificationType.BOTH;

      if (shouldSendEmail && recipient.email) {
        emailPromises.push(
          this.emailService
            .sendNotificationEmail(recipient.email, subject, {
              name: recipient.name,
              message,
            })
            .catch((error) => {
              this.logger.error(
                `Failed to send reminder email to ${recipient.email}: ${error}`,
              );
            }),
        );
      }

      if (shouldSendSms && recipient.phone) {
        smsPromises.push(
          this.smsService
            .sendNotificationSms(recipient.phone, recipient.name, message)
            .catch((error) => {
              this.logger.error(
                `Failed to send reminder SMS to ${recipient.phone}: ${error}`,
              );
            }),
        );
      }
    }

    await Promise.allSettled([...emailPromises, ...smsPromises]);
  }

  private async getReminderRecipients(event: Event): Promise<
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
    } else if (event.visibilityScope === VisibilityScope.CLASS_LEVEL) {
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
      if (!event.targetSubjects || event.targetSubjects.length === 0) {
        return recipients;
      }

      const subjectCatalogIds = event.targetSubjects.map(
        (catalog) => catalog.id,
      );

      const subjectCatalogs = await this.subjectCatalogRepository.find({
        where: { id: In(subjectCatalogIds) },
        relations: [
          'subjects',
          'subjects.classLevels',
          'subjects.classLevels.students',
        ],
      });

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
            if (classLevel.students) {
              for (const student of classLevel.students) {
                studentIds.add(student.id);
              }
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

    const uniqueRecipients = new Map<string, (typeof recipients)[0]>();
    for (const recipient of recipients) {
      const key = recipient.email || recipient.phone || '';
      if (key && !uniqueRecipients.has(key)) {
        uniqueRecipients.set(key, recipient);
      }
    }

    return Array.from(uniqueRecipients.values());
  }

  private buildReminderMessage(event: Event): string {
    const dateStr = event.isAllDay
      ? new Date(event.startDate).toLocaleDateString()
      : new Date(event.startDate).toLocaleString();

    let message = `Reminder: ${event.title}\n\n`;
    if (event.description) {
      message += `${event.description}\n\n`;
    }
    message += `Date: ${dateStr}\n`;
    if (event.location) {
      message += `Location: ${event.location}\n`;
    }
    message += `Category: ${event.category.name}`;

    return message;
  }
}
