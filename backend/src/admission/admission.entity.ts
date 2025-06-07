import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  VirtualColumn,
  OneToMany,
} from 'typeorm';
import { ClassLevel } from '../class-level/class-level.entity';
import { Guardian } from './guardian.entity';
import { School } from 'src/school/school.entity';

@Entity()
export class Admission {
  @PrimaryGeneratedColumn('uuid')
  applicationId: string; // Used for anonymous tracking

  @ManyToOne(() => School, { eager: true, onDelete: 'CASCADE' })
  school: School;

  @Column({ default: 'in_progress' })
  status: 'in_progress' | 'submitted';

  // --- Student Information ---
  @Column({ nullable: true })
  studentFirstName: string;

  @Column({ nullable: true })
  studentLastName: string;

  @Column({ nullable: true })
  studentOtherNames: string;

  @Column({ nullable: true })
  studentEmail: string;

  @Column({ nullable: true })
  studentDOB: string;

  @Column({ nullable: true })
  studentGender: string;

  @Column({ nullable: true })
  studentNationality: string;

  @Column({ nullable: true })
  studentReligion: string;

  @Column('simple-array', { nullable: true })
  studentLanguages: string[];

  @Column({ nullable: true })
  studentStreetAddress: string;

  @Column({ nullable: true })
  studentBoxAddress: string;

  @Column({ nullable: true })
  studentPhone: string;

  @Column({ nullable: true })
  studentOtherPhone: string;

  @Column({ nullable: true })
  studentOtherPhoneOptional: string;

  @Column({ nullable: true })
  studentPhotoUrl: string;

  @Column({ nullable: true })
  studentBirthCertUrl: string;

  @Column({ nullable: true })
  academicYear: string;

  @ManyToOne(() => ClassLevel, { nullable: true })
  forClass: ClassLevel;

  // Student Headshot
  @Column({ nullable: true })
  studentHeadshotPath: string;

  @Column({ nullable: true })
  studentHeadshotMediaType: string;

  @VirtualColumn({
    query: (alias) => `(NULL)`, // Placeholder, handled in code
  })
  studentHeadshotUrl?: string;

  // --- Family Information (Guardian 1, can be extended for more) ---
  @OneToMany(() => Guardian, (guardian) => guardian.admission, {
    cascade: true,
    eager: true,
  })
  guardians: Guardian[];

  // --- Additional Information ---
  @Column({ nullable: true })
  homePrimaryLanguage: string;

  @Column({ nullable: true })
  homeOtherLanguage: string;

  @Column({ nullable: true, default: false })
  hasPreviousSchool: boolean;

  @Column({ nullable: true })
  previousSchoolName: string;

  @Column({ nullable: true })
  previousSchoolUrl: string;

  @Column({ nullable: true })
  previousSchoolStreetAddress: string;

  @Column({ nullable: true })
  previousSchoolCity: string;

  @Column({ nullable: true })
  previousSchoolState: string;

  @Column({ nullable: true })
  previousSchoolCountry: string;

  @Column({ nullable: true })
  previousSchoolBoxAddress: string;

  @Column({ nullable: true })
  previousSchoolPhone: string;

  @Column({ nullable: true })
  previousSchoolAttendedFrom: string;

  @Column({ nullable: true })
  previousSchoolAttendedTo: string;

  @Column({ nullable: true })
  previousSchoolGradeClass: string;

  // Previous School Result
  @Column({ nullable: true })
  previousSchoolResultPath: string;

  @Column({ nullable: true })
  previousSchoolResultMediaType: string;

  @VirtualColumn({
    query: (alias) => `(NULL)`, // Placeholder, handled in code
  })
  previousSchoolResultUrl?: string;

  // --- Timestamps ---
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
