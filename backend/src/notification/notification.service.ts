import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { School } from 'src/school/school.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,

    @InjectRepository(School)
    private schoolRepository: Repository<School>,
  ) {}

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

  async findAllForSchool(schoolId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { school: { id: schoolId } },
      order: { createdAt: 'DESC' },
    });
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

  async remove(id: string): Promise<void> {
    const notification = await this.notificationRepository.findOneBy({ id });
    if (!notification) throw new NotFoundException('Notification not found');
    await this.notificationRepository.delete(id);
  }
}
