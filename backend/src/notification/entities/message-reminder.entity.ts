import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { School } from 'src/school/school.entity';
import { Student } from 'src/student/student.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';

export enum ReminderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SCHEDULED = 'scheduled',
}

export enum ReminderType {
  IMMEDIATE = 'immediate',
  SCHEDULED = 'scheduled',
  RECURRING = 'recurring',
}

@Entity()
export class MessageReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.ACTIVE,
  })
  status: ReminderStatus;

  @Column({
    type: 'enum',
    enum: ReminderType,
    default: ReminderType.IMMEDIATE,
  })
  type: ReminderType;

  @Column({ default: false })
  sendToStudents: boolean;

  @Column({ default: true })
  sendToParents: boolean;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastSentAt: Date;

  @Column({ default: 0 })
  sentCount: number;

  @Column({ default: 0 })
  totalRecipients: number;

  @ManyToOne(() => School, { eager: true, onDelete: 'CASCADE' })
  school: School;

  @ManyToOne(() => SchoolAdmin, { eager: true })
  createdBy: SchoolAdmin;

  @ManyToMany(() => Student, { eager: true })
  @JoinTable({
    name: 'message_reminder_students',
    joinColumn: { name: 'reminderId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'studentId', referencedColumnName: 'id' },
  })
  targetStudents: Student[];

  @Column('simple-array', { nullable: true })
  targetClassLevels: string[]; // Class level IDs for bulk targeting

  @Column('simple-array', { nullable: true })
  targetGrades: string[]; // Grade IDs for bulk targeting

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
