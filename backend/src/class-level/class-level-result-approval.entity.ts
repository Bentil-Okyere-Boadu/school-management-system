import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  Unique,
} from 'typeorm';
import { ClassLevel } from './class-level.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';
import { SchoolAdmin } from '../school-admin/school-admin.entity';

export type ClassResultStatus =
  | 'draft'
  | 'submitted'
  | 'returned'
  | 'approved'
  | 'published';

@Entity()
@Unique(['classLevel', 'academicTerm'])
export class ClassLevelResultApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClassLevel, { eager: true, onDelete: 'CASCADE' })
  classLevel: ClassLevel;

  @ManyToOne(() => AcademicTerm, { eager: true, onDelete: 'CASCADE' })
  academicTerm: AcademicTerm;

  @Column({ default: false })
  approved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  // School Admin approval fields
  @Column({ default: false })
  schoolAdminApproved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  schoolAdminApprovedAt?: Date;

  @ManyToOne(() => SchoolAdmin, { nullable: true, onDelete: 'SET NULL' })
  approvedBySchoolAdmin?: SchoolAdmin;

  @Column({ type: 'varchar', default: 'draft' })
  resultStatus: ClassResultStatus;

  @Column({ type: 'text', nullable: true })
  returnNote: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  returnedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  returnedById: string | null;

  @Column({ type: 'varchar', nullable: true })
  returnedByName: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  adminApprovedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  adminApprovedById: string | null;

  @Column({ type: 'varchar', nullable: true })
  adminApprovedByName: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  publishedById: string | null;

  @Column({ type: 'varchar', nullable: true })
  publishedByName: string | null;
}
