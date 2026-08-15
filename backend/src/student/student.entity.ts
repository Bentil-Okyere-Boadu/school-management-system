import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { School } from '../school/school.entity';
import { Role } from '../role/role.entity';
import { Profile } from 'src/profile/profile.entity';
import { Parent } from '../parent/parent.entity';
import { ParentStudent } from '../parent/parent-student.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { PaymentTransaction } from 'src/payments/entities/payment-transaction.entity';
import { PaymentReceipt } from 'src/payments/entities/payment-receipt.entity';
import { PaymentAllocation } from 'src/payments/entities/payment-allocation.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity()
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column()
  password: string; // For PIN storage

  @ManyToOne(() => Role, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  role: Role;

  @ManyToOne(() => School, (school) => school.students, {
    onDelete: 'CASCADE',
    eager: true,
  })
  school: School;

  @OneToOne(() => Profile, (profile) => profile.student, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  invitationToken: string;

  @Column({ nullable: true })
  invitationExpires: Date;

  @Column({ default: false })
  isInvitationAccepted: boolean;

  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({ nullable: true })
  resetPasswordExpires: Date;

  @Column({ unique: true })
  studentId: string; // Custom generated ID for student login

  @Column({ type: 'varchar', nullable: true, unique: true })
  studentBillingCode: string | null;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Parent, (parent) => parent.student, {
    cascade: true,
    eager: false,
    onDelete: 'SET NULL',
  })
  parents: Parent[];

  @OneToMany(() => ParentStudent, (link) => link.student, {
    cascade: true,
    eager: true,
  })
  parentStudents: ParentStudent[];

  @ManyToMany(() => ClassLevel, (classLevel) => classLevel.students)
  classLevels: ClassLevel[];

  @OneToMany(() => PaymentTransaction, (transaction) => transaction.student)
  paymentTransactions: PaymentTransaction[];

  @OneToMany(() => PaymentReceipt, (receipt) => receipt.student)
  paymentReceipts: PaymentReceipt[];

  @OneToMany(() => PaymentAllocation, (allocation) => allocation.student)
  paymentAllocations: PaymentAllocation[];
}
