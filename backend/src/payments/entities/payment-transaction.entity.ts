import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { School } from 'src/school/school.entity';
import { Student } from 'src/student/student.entity';
import { PaymentAllocation } from './payment-allocation.entity';
import { PaymentReceipt } from './payment-receipt.entity';

export enum PaymentProvider {
  HUBTEL = 'hubtel',
  /** Internal: prepayment credit applied to fee obligations (not a Hubtel cash payment). */
  INTERNAL_CREDIT = 'internal_credit',
}

export enum PaymentTransactionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ unique: true })
  sessionId: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  orderId: string | null;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  hubtelTransactionId: string | null;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  networkTransactionId: string | null;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.HUBTEL,
  })
  provider: PaymentProvider;

  @Index()
  @Column({
    type: 'enum',
    enum: PaymentTransactionStatus,
    default: PaymentTransactionStatus.PENDING,
  })
  status: PaymentTransactionStatus;

  @Column({ type: 'varchar', nullable: true })
  providerStatus: string | null;

  @Column({ type: 'varchar', nullable: true })
  mobile: string | null;

  @Column({ type: 'varchar', nullable: true, default: 'GHS' })
  currency: string | null;

  @Column('float', { default: 0 })
  amount: number;

  @Column('float', { default: 0 })
  charges: number;

  @Column('float', { default: 0 })
  amountAfterCharges: number;

  @Column({ default: false })
  isFulfilled: boolean;

  @Column({ type: 'varchar', nullable: true })
  paymentMethod: string | null;

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  paymentDate: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  rawInteractionPayload: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  rawFulfilmentPayload: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastStatusCheckAt: Date | null;

  /** When set (USSD "pay specific fee"), allocation applies to this fee first, then remainder auto. */
  @Column({ type: 'varchar', nullable: true })
  targetFeeStructureId: string | null;

  /** When set, allocation prioritises this obligation first (specific line / period). */
  @Column({ type: 'varchar', nullable: true })
  targetStudentFeeObligationId: string | null;

  @ManyToOne(() => School, { onDelete: 'CASCADE', eager: true })
  @JoinColumn()
  school: School;

  @ManyToOne(() => Student, { onDelete: 'CASCADE', eager: true })
  @JoinColumn()
  student: Student;

  @OneToMany(() => PaymentAllocation, (allocation) => allocation.transaction, {
    cascade: true,
  })
  allocations: PaymentAllocation[];

  @OneToOne(() => PaymentReceipt, (receipt) => receipt.transaction, {
    cascade: true,
    nullable: true,
  })
  receipt: PaymentReceipt | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
