import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Parent } from './parent.entity';
import { Student } from '../student/student.entity';
import { School } from '../school/school.entity';
import {
  ParentStudentSource,
  ParentStudentStatus,
} from './parent.enums';

@Entity()
@Unique(['parent', 'student'])
@Index(['status'])
export class ParentStudent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Parent, (parent) => parent.parentStudents, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  parent: Parent;

  @ManyToOne(() => Student, (student) => student.parentStudents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  student: Student;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn()
  school: School;

  @Column({ type: 'varchar', nullable: true })
  relationship: string | null;

  @Column({ type: 'varchar', default: ParentStudentStatus.Pending })
  status: ParentStudentStatus;

  @Column({ type: 'varchar', default: ParentStudentSource.StudentProfile })
  source: ParentStudentSource;

  @Column({ type: 'varchar', nullable: true })
  confirmationToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  confirmationExpires: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  invitedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
