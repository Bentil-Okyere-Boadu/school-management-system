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
}
