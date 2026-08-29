import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationRecipientRole,
  NotificationType,
} from './notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { School } from 'src/school/school.entity';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';
import { SchoolProvisioningStatus } from 'src/tenant/school-provisioning-status';

export type NotificationRecipient = {
  id: string;
  role: NotificationRecipientRole;
};

export type CreateForRecipientsInput = {
  schoolId: string;
  type: NotificationType;
  title: string;
  message: string;
  recipients: NotificationRecipient[];
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,

    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    private readonly tenantConnection: TenantConnectionService,
  ) {}

  private async withSchoolTenant<T>(
    schoolId: string,
    fn: () => Promise<T>,
    fallback: T,
  ): Promise<T> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (
      !school?.schemaName ||
      school.provisioningStatus !== SchoolProvisioningStatus.Active ||
      school.isDisabled
    ) {
      return fallback;
    }
    const store = this.tenantConnection.tryGetStore();
    if (store?.schoolId === schoolId) {
      return fn();
    }
    return this.tenantConnection.runForSchoolId(schoolId, fn);
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const school = await this.schoolRepository.findOne({
      where: { id: dto.schoolId },
    });

    if (!school) throw new NotFoundException('School not found');

    const notification = this.notificationRepository.create({
      message: dto.message,
      title: dto.title,
      type: dto.type,
      school,
    });
    return this.notificationRepository.save(notification);
  }

  async createForRecipients(input: CreateForRecipientsInput): Promise<void> {
    try {
      const uniqueRecipients = this.dedupeRecipients(input.recipients);
      if (uniqueRecipients.length === 0) {
        return;
      }

      const school = await this.schoolRepository.findOne({
        where: { id: input.schoolId },
      });
      if (!school) {
        this.logger.error(
          `Failed to create recipient notifications: school ${input.schoolId} not found`,
        );
        return;
      }

      const notifications = uniqueRecipients.map((recipient) =>
        this.notificationRepository.create({
          title: input.title,
          message: input.message,
          type: input.type,
          school,
          recipientRole: recipient.role,
          recipientId: recipient.id,
        }),
      );

      await this.notificationRepository.save(notifications);
    } catch (error) {
      this.logger.error(
        `Failed to create recipient notifications: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async findAllForSchool(
    schoolId: string,
    search?: string,
  ): Promise<Notification[]> {
    return this.withSchoolTenant(
      schoolId,
      async () => {
        const queryBuilder = this.notificationRepository
          .createQueryBuilder('notification')
          .where('notification.school.id = :schoolId', { schoolId })
          .andWhere('notification.recipientId IS NULL');

        if (search && search.trim()) {
          const searchTerm = `%${search.trim()}%`;
          queryBuilder.andWhere(
            '(notification.title ILIKE :search OR notification.message ILIKE :search)',
            { search: searchTerm },
          );
        }

        return queryBuilder.orderBy('notification.createdAt', 'DESC').getMany();
      },
      [],
    );
  }

  async findAllForRecipient(
    role: NotificationRecipientRole,
    userId: string,
    search?: string,
  ): Promise<Notification[]> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.recipientRole = :role', { role })
      .andWhere('notification.recipientId = :userId', { userId });

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        '(notification.title ILIKE :search OR notification.message ILIKE :search)',
        { search: searchTerm },
      );
    }

    return queryBuilder.orderBy('notification.createdAt', 'DESC').getMany();
  }

  async update(id: string, dto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.notificationRepository.findOneBy({ id });
    if (!notification) throw new NotFoundException('Notification not found');
    Object.assign(notification, dto);
    return this.notificationRepository.save(notification);
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOneBy({ id });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  async markAsReadForRecipient(
    id: string,
    role: NotificationRecipientRole,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.findOwnedOrFail(id, role, userId);
    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(schoolId: string): Promise<{ updated: number }> {
    return this.withSchoolTenant(
      schoolId,
      async () => {
        const result = await this.notificationRepository
          .createQueryBuilder()
          .update(Notification)
          .set({ read: true })
          .where('schoolId = :schoolId', { schoolId })
          .andWhere('recipientId IS NULL')
          .andWhere('read = :read', { read: false })
          .execute();

        return { updated: result.affected ?? 0 };
      },
      { updated: 0 },
    );
  }

  async markAllAsReadForRecipient(
    role: NotificationRecipientRole,
    userId: string,
  ): Promise<{ updated: number }> {
    const result = await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ read: true })
      .where('recipientRole = :role', { role })
      .andWhere('recipientId = :userId', { userId })
      .andWhere('read = :read', { read: false })
      .execute();

    return { updated: result.affected ?? 0 };
  }

  async remove(id: string): Promise<void> {
    const notification = await this.notificationRepository.findOneBy({ id });
    if (!notification) throw new NotFoundException('Notification not found');
    await this.notificationRepository.delete(id);
  }

  async removeForRecipient(
    id: string,
    role: NotificationRecipientRole,
    userId: string,
  ): Promise<void> {
    const notification = await this.findOwnedOrFail(id, role, userId);
    await this.notificationRepository.delete(notification.id);
  }

  private async findOwnedOrFail(
    id: string,
    role: NotificationRecipientRole,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, recipientRole: role, recipientId: userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  private dedupeRecipients(
    recipients: NotificationRecipient[],
  ): NotificationRecipient[] {
    const seen = new Set<string>();
    const unique: NotificationRecipient[] = [];

    for (const recipient of recipients) {
      if (!recipient?.id || !recipient.role) {
        continue;
      }
      const key = `${recipient.role}:${recipient.id}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      unique.push(recipient);
    }

    return unique;
  }
}
