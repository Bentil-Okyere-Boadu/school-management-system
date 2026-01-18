import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { School } from '../../school/school.entity';
import { SchoolAdmin } from '../../school-admin/school-admin.entity';
import { Teacher } from '../../teacher/teacher.entity';
import { ClassLevel } from '../../class-level/class-level.entity';
import { SubjectCatalog } from '../../subject/subject-catalog.entity';
import { EventCategory } from './event-category.entity';
import { EventAttachment } from './event-attachment.entity';
import { EventReminder } from './event-reminder.entity';

export enum VisibilityScope {
  SCHOOL_WIDE = 'school_wide',
  CLASS_LEVEL = 'class_level',
  SUBJECT = 'subject',
  TEACHERS = 'teachers',
}

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null;

  @Column({ default: false })
  isAllDay: boolean;

  @Column({ default: true })
  sendNotifications: boolean;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @ManyToOne(() => EventCategory, (category) => category.events, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn()
  category: EventCategory;

  @Column({
    type: 'enum',
    enum: VisibilityScope,
    default: VisibilityScope.SCHOOL_WIDE,
  })
  visibilityScope: VisibilityScope;

  @ManyToOne(() => School, { onDelete: 'CASCADE', eager: true })
  @JoinColumn()
  school: School;

  @Column({ nullable: true })
  createdByTeacherId: string | null;

  @Column({ nullable: true })
  createdByAdminId: string | null;

  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdByTeacherId' })
  createdByTeacher: Teacher;

  @ManyToOne(() => SchoolAdmin, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdByAdminId' })
  createdByAdmin: SchoolAdmin;

  @ManyToMany(() => ClassLevel, { eager: true })
  @JoinTable({
    name: 'event_class_levels',
    joinColumn: { name: 'event_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'class_level_id', referencedColumnName: 'id' },
  })
  targetClassLevels: ClassLevel[];

  @ManyToMany(() => SubjectCatalog, { eager: true })
  @JoinTable({
    name: 'event_subject_catalogs',
    joinColumn: { name: 'event_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'subject_catalog_id',
      referencedColumnName: 'id',
    },
  })
  targetSubjects: SubjectCatalog[];

  @OneToMany(() => EventAttachment, (attachment) => attachment.event, {
    cascade: true,
  })
  attachments: EventAttachment[];

  @OneToMany(() => EventReminder, (reminder) => reminder.event, {
    cascade: true,
  })
  reminders: EventReminder[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
