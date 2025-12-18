import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { School } from 'src/school/school.entity';
import { EventCategory } from './event-category.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';

export enum EventVisibility {
  SCHOOL_WIDE = 'school_wide',
  YEAR_GROUP = 'year_group',
  CLASS = 'class',
  SUBJECT = 'subject',
}

@Entity()
export class PlannerEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @Column({ type: 'boolean', default: false })
  allDay: boolean;

  @ManyToOne(() => EventCategory, (category) => category.events, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category?: EventCategory;

  @Column({
    type: 'enum',
    enum: EventVisibility,
    default: EventVisibility.SCHOOL_WIDE,
  })
  visibility: EventVisibility;

  @ManyToOne(() => School, (school) => school.plannerEvents, {
    onDelete: 'CASCADE',
  })
  school: School;

  @ManyToMany(() => ClassLevel)
  @JoinTable({
    name: 'planner_event_class_levels',
    joinColumn: {
      name: 'event_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'class_level_id',
      referencedColumnName: 'id',
    },
  })
  classLevels: ClassLevel[];

  @Column({ type: 'simple-array', nullable: true })
  attachmentUrls?: string[];

  @Column({ type: 'boolean', default: false })
  hasReminder: boolean;

  @Column({ type: 'timestamp', nullable: true })
  reminderDate?: Date;

  @ManyToOne(() => SchoolAdmin, { nullable: true, onDelete: 'SET NULL' })
  createdBy: SchoolAdmin;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

