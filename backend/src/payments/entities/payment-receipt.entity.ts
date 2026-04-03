import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentTransaction } from './payment-transaction.entity';
import { School } from 'src/school/school.entity';
import { Student } from 'src/student/student.entity';

@Entity()
export class PaymentReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  receiptNumber: string;

  @Column('float')
  amount: number;

  @ManyToOne(() => School, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  school: School;

  @ManyToOne(() => Student, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  student: Student;

  @OneToOne(() => PaymentTransaction, (transaction) => transaction.receipt, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  transaction: PaymentTransaction;

  @CreateDateColumn()
  issuedAt: Date;
}
