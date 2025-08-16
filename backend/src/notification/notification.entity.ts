import { School } from 'src/school/school.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum NotificationType {
  Admission = 'admission',
  Attendance = 'attendance',
  Results = 'results',
  Fee = 'fee',
  General = 'general',
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ default: NotificationType.General })
  type: NotificationType;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => School, (school) => school.admins, { eager: true })
  school: School;
}
