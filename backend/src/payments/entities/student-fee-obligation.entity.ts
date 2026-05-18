import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Student } from 'src/student/student.entity';
import { FeeStructure } from 'src/fee-structure/fee-structure.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { AcademicCalendar } from 'src/academic-calendar/entitites/academic-calendar.entity';

/**
 * One receivable line for a student: a fee definition plus a time period
 * (daily / monthly / term / yearly / legacy pre-cutover bucket).
 */
@Entity()
@Unique(['student', 'feeStructure', 'periodKey'])
@Index(['student', 'isLegacy'])
export class StudentFeeObligation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn()
  student: Student;

  @ManyToOne(() => FeeStructure, { onDelete: 'CASCADE' })
  @JoinColumn()
  feeStructure: FeeStructure;

  /** Stable key: legacy:{feeId}, term:{termId}, year:{calId}:{sy}, month:YYYY-MM, day:YYYY-MM-DD */
  @Column()
  periodKey: string;

  @Column({ type: 'date' })
  periodStart: string;

  @Column({ type: 'date' })
  periodEnd: string;

  /** Snapshot of fee.amount when the obligation row was created. */
  @Column('float')
  amountDue: number;

  @Column({ default: false })
  isLegacy: boolean;

  @ManyToOne(() => AcademicTerm, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  academicTerm: AcademicTerm | null;

  @ManyToOne(() => AcademicCalendar, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  academicCalendar: AcademicCalendar | null;

  @CreateDateColumn()
  createdAt: Date;
}
