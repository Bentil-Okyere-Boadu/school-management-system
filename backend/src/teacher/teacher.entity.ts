import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../role/role.entity';
import { School } from '../school/school.entity';

@Entity()
export class Teacher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ unique: true })
  teacherId: string;

  @ManyToOne(() => Role, { eager: true })
  role: Role;

  @ManyToOne(() => School, (school) => school.teachers, { eager: true })
  school: School;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ default: false })
  isInvitationAccepted: boolean;

  @Column({ nullable: true })
  invitationToken: string;

  @Column({ nullable: true, type: 'timestamp' })
  invitationExpires: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
