import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Event } from './event.entity';

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  BOTH = 'both',
}

@Entity()
export class EventReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, (event) => event.reminders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  event: Event;

  @Column({ type: 'timestamp' })
  reminderTime: Date;

  @Column({ default: false })
  sent: boolean;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.BOTH,
  })
  notificationType: NotificationType;

  @CreateDateColumn()
  createdAt: Date;
}


