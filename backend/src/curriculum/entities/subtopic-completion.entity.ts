import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  JoinColumn,
} from 'typeorm';
import { Subtopic } from './subtopic.entity';
import { Subject } from '../../subject/subject.entity';
import { AcademicTerm } from '../../academic-calendar/entitites/academic-term.entity';
import { ClassLevel } from '../../class-level/class-level.entity';

@Entity()
@Unique(['subtopic', 'subject', 'academicTerm', 'classLevel'])
export class SubtopicCompletion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subtopic, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subtopic_id' })
  subtopic: Subtopic;

  @ManyToOne(() => Subject, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @ManyToOne(() => AcademicTerm, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_term_id' })
  academicTerm: AcademicTerm;

  /** Nullable only during TypeORM synchronize upgrade; backfill sets NOT NULL in DB. */
  @ManyToOne(() => ClassLevel, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_level_id' })
  classLevel: ClassLevel | null;

  @CreateDateColumn()
  completedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  completedBy: string; // user id or teacher id
}
