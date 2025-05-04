import { Role } from 'src/role/role.entity';
import { School } from 'src/school/school.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @ManyToOne(() => Role, (role) => role.users)
  role: Role;

  @ManyToOne(() => School, (school) => school.users, { nullable: true })
  school: School;

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

  @Column({ nullable: true, unique: true })
  studentId: string;

  @Column({ nullable: true, unique: true })
  teacherId: string;

  @Column({ nullable: true, unique: true })
  adminId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
