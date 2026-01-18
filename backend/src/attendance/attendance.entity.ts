import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  Unique,
} from 'typeorm';
import { Student } from '../student/student.entity';
import { ClassLevel } from '../class-level/class-level.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';
import { AcademicCalendar } from '../academic-calendar/entitites/academic-calendar.entity';

@Entity()
@Unique(['student', 'classLevel', 'date'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { eager: true })
  student: Student;

  @ManyToOne(() => ClassLevel, { eager: true })
  classLevel: ClassLevel;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: 'present' }) // or 'absent'
  status: 'present' | 'absent';

  @ManyToOne(() => AcademicTerm, { nullable: true })
  academicTerm: AcademicTerm;

  @ManyToOne(() => AcademicCalendar, { nullable: true })
  academicCalendar: AcademicCalendar;
}
