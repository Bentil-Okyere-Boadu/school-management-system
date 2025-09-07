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

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE' })
  student: Student;

  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL' })
  teacher: Teacher;

  @ManyToOne(() => AcademicTerm, { nullable: false, onDelete: 'CASCADE' })
  academicTerm: AcademicTerm;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
