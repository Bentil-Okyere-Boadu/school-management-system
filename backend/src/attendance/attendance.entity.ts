import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  Unique,
} from 'typeorm';
import { Student } from '../student/student.entity';
import { ClassLevel } from '../class-level/class-level.entity';

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
}
