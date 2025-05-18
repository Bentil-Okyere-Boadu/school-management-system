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

  /**
   * School code used for generating IDs
   * Format: 5-digit unique identifier
   */
  @Column({ nullable: true, unique: true })
  schoolCode: string;

  @OneToMany(() => SchoolAdmin, (admin) => admin.school)
  admins: SchoolAdmin[];

  @OneToMany(() => Student, (student) => student.school)
  students: Student[];

  @OneToMany(() => ClassLevel, (classLevel) => classLevel.school)
  classLevels: ClassLevel[];

  @OneToMany(() => AdmissionPolicy, (admissionPolicy) => admissionPolicy.school)
  admissionPolicies: AdmissionPolicy[];

  @OneToMany(() => GradingSystem, (gradingSystem) => gradingSystem.school)
  gradingSystems: GradingSystem[];

  @OneToMany(() => FeeStructure, (feeStructure) => feeStructure.school)
  feeStructures: FeeStructure[];

  @OneToOne(() => Profile, (profile) => profile.school, { cascade: true })
  profile: Profile;

  @OneToMany(
    () => AcademicCalendar,
    (academicCalendar) => academicCalendar.school,
  )
  academicCalendars: AcademicCalendar[];

  @OneToMany(() => Teacher, (teacher) => teacher.school)
  teachers: Teacher[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
