import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentTransaction } from './payment-transaction.entity';
import { FeeStructure } from 'src/fee-structure/fee-structure.entity';
import { Student } from 'src/student/student.entity';
import { StudentFeeObligation } from './student-fee-obligation.entity';

@Entity()
export class PaymentAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => PaymentTransaction,
    (transaction) => transaction.allocations,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn()
  transaction: PaymentTransaction;

  @ManyToOne(() => Student, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  student: Student;

  @ManyToOne(() => FeeStructure, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  feeStructure: FeeStructure | null;

  @ManyToOne(() => StudentFeeObligation, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  obligation: StudentFeeObligation | null;

  @Column('float')
  allocatedAmount: number;

  @Column({ default: 1 })
  allocationOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}
