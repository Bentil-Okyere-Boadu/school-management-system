import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Student } from '../student/student.entity';
import { Subject } from './subject.entity';
import { ClassLevel } from '../class-level/class-level.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';
import { AcademicCalendar } from '../academic-calendar/entitites/academic-calendar.entity';
import { Teacher } from '../teacher/teacher.entity';

@Entity()
@Unique(['student', 'subject', 'classLevel', 'academicTerm'])
export class StudentGrade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { eager: true, onDelete: 'CASCADE' })
  student: Student;

  @ManyToOne(() => Subject, { eager: true, onDelete: 'CASCADE' })
  subject: Subject;

  @ManyToOne(() => ClassLevel, { eager: true, onDelete: 'CASCADE' })
  classLevel: ClassLevel;

  @ManyToOne(() => AcademicTerm, { eager: true, onDelete: 'CASCADE' })
  academicTerm: AcademicTerm;

  @ManyToOne(() => AcademicCalendar, { eager: true, onDelete: 'CASCADE' })
  academicCalendar: AcademicCalendar;

  @ManyToOne(() => Teacher, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  teacher: Teacher;

  @Column('float')
  classScore: number;

  @Column('float')
  examScore: number;

  @Column('float')
  totalScore: number;

  @Column({ type: 'varchar', nullable: true })
  grade: string;

  @Column({ type: 'varchar', nullable: true })
  gradeLabel: string | null;

  @Column({ type: 'text', nullable: true })
  feedback: string | null;

  @Column({ type: 'varchar', default: 'submitted' })
  status: 'draft' | 'submitted';

  @Column({ type: 'text', nullable: true })
  bandDescription: string | null;

  @Column({ type: 'uuid', nullable: true })
  gradingSchemeId: string | null;

  @Column({ type: 'int', nullable: true })
  gradingSchemeVersion: number | null;

  @Column({ type: 'varchar', nullable: true })
  overrideGrade: string | null;

  @Column({ type: 'text', nullable: true })
  overrideReason: string | null;

  @Column({ type: 'uuid', nullable: true })
  overriddenById: string | null;

  @Column({ type: 'varchar', nullable: true })
  overriddenByName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
