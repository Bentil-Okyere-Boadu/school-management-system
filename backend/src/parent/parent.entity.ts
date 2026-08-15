import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../student/student.entity';
import { Profile } from 'src/profile/profile.entity';
import { School } from '../school/school.entity';
import { Role } from 'src/role/role.entity';
import { ParentStudent } from './parent-student.entity';
import { ParentAccountStatus } from './parent.enums';

@Entity()
@Unique('UQ_parent_school_email', ['school', 'email'])
export class Parent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  occupation: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  /** Legacy field kept for backfill; live value is ParentStudent.relationship */
  @Column({ type: 'varchar', nullable: true })
  relationship: string | null;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ type: 'varchar', default: ParentAccountStatus.Pending })
  status: string;

  @ManyToOne(() => Role, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  role: Role;

  @ManyToOne(() => School, { onDelete: 'CASCADE', eager: true, nullable: true })
  school: School;

  @Column({ type: 'varchar', nullable: true })
  invitationToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  invitationExpires: Date | null;

  @Column({ default: false })
  isInvitationAccepted: boolean;

  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resetPasswordExpires: Date | null;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ default: false })
  isSuspended: boolean;

  /**
   * Legacy 1:1 student FK kept nullable for backfill.
   * New links live on ParentStudent.
   */
  @ManyToOne(() => Student, (student) => student.parents, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  student: Student | null;

  @OneToMany(() => ParentStudent, (link) => link.parent, {
    cascade: true,
  })
  parentStudents: ParentStudent[];

  @OneToOne(() => Profile, (profile) => profile.parent, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
