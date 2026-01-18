import { ClassLevel } from '../class-level/class-level.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { AdmissionPolicy } from '../admission-policy/admission-policy.entity';
import { GradingSystem } from '../grading-system/grading-system.entity';
import { FeeStructure } from '../fee-structure/fee-structure.entity';
import { AcademicCalendar } from '../academic-calendar/entitites/academic-calendar.entity';
import { Profile } from 'src/profile/profile.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Student } from 'src/student/student.entity';
import { Teacher } from '../teacher/teacher.entity';
import { VirtualColumn } from 'typeorm/decorator/columns/VirtualColumn';
import { EventCategory } from '../planner/entities/event-category.entity';

@Entity()
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  calendlyUrl: string;

  @Column({ type: 'varchar', nullable: true })
  logoPath: string | null;

  @Column({ type: 'varchar', nullable: true })
  mediaType: string | null;

  @VirtualColumn({
    query: (alias) => `(NULL)`, // Placeholder: handled dynamically in code
  })
  logoUrl?: string;

  /**
   * School code used for generating IDs
   * Format: 5-digit unique identifier
   */
  @Column({ nullable: true, unique: true })
  schoolCode: string;

  @Column({ type: 'float', default: 30 })
  classScorePercentage: number;

  @Column({ type: 'float', default: 70 })
  examScorePercentage: number;

  @OneToMany(() => SchoolAdmin, (admin) => admin.school, {
    onDelete: 'CASCADE',
  })
  admins: SchoolAdmin[];

  @OneToMany(() => Student, (student) => student.school, {
    onDelete: 'CASCADE',
  })
  students: Student[];

  @OneToMany(() => ClassLevel, (classLevel) => classLevel.school, {
    onDelete: 'CASCADE',
  })
  classLevels: ClassLevel[];

  @OneToMany(
    () => AdmissionPolicy,
    (admissionPolicy) => admissionPolicy.school,
    {
      onDelete: 'CASCADE',
    },
  )
  admissionPolicies: AdmissionPolicy[];

  @OneToMany(() => GradingSystem, (gradingSystem) => gradingSystem.school, {
    onDelete: 'CASCADE',
  })
  gradingSystems: GradingSystem[];

  @OneToMany(() => FeeStructure, (feeStructure) => feeStructure.school, {
    onDelete: 'CASCADE',
  })
  feeStructures: FeeStructure[];

  @OneToOne(() => Profile, (profile) => profile.school, { cascade: true })
  profile: Profile;

  @OneToMany(
    () => AcademicCalendar,
    (academicCalendar) => academicCalendar.school,
    {
      onDelete: 'CASCADE',
    },
  )
  academicCalendars: AcademicCalendar[];

  @OneToMany(() => Teacher, (teacher) => teacher.school, {
    onDelete: 'CASCADE',
  })
  teachers: Teacher[];

  @OneToMany(() => EventCategory, (category) => category.school, {
    onDelete: 'CASCADE',
  })
  eventCategories: EventCategory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
