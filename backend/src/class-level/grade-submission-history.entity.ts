import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { ClassLevel } from './class-level.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';

export type GradeSubmissionHistoryAction =
  | 'submitted'
  | 'returned'
  | 'approved'
  | 'published'
  | 'unlocked';

@Entity()
export class GradeSubmissionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClassLevel, { onDelete: 'CASCADE' })
  classLevel: ClassLevel;

  @ManyToOne(() => AcademicTerm, { onDelete: 'CASCADE' })
  academicTerm: AcademicTerm;

  @Column({ type: 'varchar' })
  action: GradeSubmissionHistoryAction;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'uuid', nullable: true })
  performedById: string | null;

  @Column({ type: 'varchar', nullable: true })
  performedByName: string | null;

  @Column({ type: 'varchar', nullable: true })
  performedByRole: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
