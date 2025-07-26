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

  @ManyToOne(() => Student, { eager: true })
  student: Student;

  @ManyToOne(() => Subject, { eager: true })
  subject: Subject;

  @ManyToOne(() => ClassLevel, { eager: true })
  classLevel: ClassLevel;

  @ManyToOne(() => AcademicTerm, { eager: true })
  academicTerm: AcademicTerm;

  @ManyToOne(() => AcademicCalendar, { eager: true })
  academicCalendar: AcademicCalendar;

  @ManyToOne(() => Teacher, { eager: true })
  teacher: Teacher;

  @Column('float')
  classScore: number;

  @Column('float')
  examScore: number;

  @Column('float')
  totalScore: number;

  @Column()
  grade: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 