import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { School } from 'src/school/school.entity';
import { Student } from 'src/student/student.entity';
import { HubtelMobileMoneyChannel } from 'src/integrations/hubtel/dto/initiate-receive-money.dto';

/**
 * Short-lived OTP record used to gate the public, unauthenticated billing-code
 * checkout flow. The OTP code is stored as a salted SHA-256 hash; never plain.
 *
 * The intent fields (amount, mobile, channel, targetFeeStructureId) are bound
 * to the OTP request so the verify step cannot tamper with them.
 */
@Entity()
export class CheckoutOtp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar' })
  msisdn: string;

  @Column({ type: 'varchar' })
  channel: HubtelMobileMoneyChannel;

  @Column('float')
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  targetFeeStructureId: string | null;

  @Column({ type: 'varchar', nullable: true })
  targetStudentFeeObligationId: string | null;

  @Column({ type: 'varchar', nullable: true })
  customerName: string | null;

  @Column({ type: 'varchar', nullable: true })
  customerEmail: string | null;

  /** Salted SHA-256 of the OTP code; never store plain text. */
  @Column({ type: 'varchar' })
  codeHash: string;

  @Column({ type: 'varchar' })
  salt: string;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Index()
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt: Date | null;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn()
  school: School;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn()
  student: Student;

  @CreateDateColumn()
  createdAt: Date;
}
