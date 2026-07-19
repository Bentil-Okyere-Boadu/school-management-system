import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from 'src/student/student.entity';
import { School } from 'src/school/school.entity';

/**
 * Per-student prepayment / overpay wallet.
 * Surplus from PAID allocations (null obligation) increments availableCredit;
 * applyAvailableCredit consumes it against open obligations.
 */
@Entity()
export class StudentCreditBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn()
  student: Student;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn()
  school: School;

  /** Remaining credit that can reduce future outstanding (GHS). */
  @Column('float', { default: 0 })
  availableCredit: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
