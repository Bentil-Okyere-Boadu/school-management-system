import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Teacher } from '../teacher/teacher.entity';
import { Student } from '../student/student.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';

@Entity()
export class StudentTermRemark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  remarks: string;

  @ManyToOne(() => Student, { nullable: false })
  student: Student;

  @ManyToOne(() => Teacher, { nullable: false })
  teacher: Teacher;

  @ManyToOne(() => AcademicTerm, { nullable: false })
  academicTerm: AcademicTerm;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
