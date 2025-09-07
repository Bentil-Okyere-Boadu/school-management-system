import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { School } from '../school/school.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Student } from '../student/student.entity';

@Entity()
export class ClassLevel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => School, (school) => school.classLevels, {
    onDelete: 'CASCADE',
  })
  school: School;

  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL' })
  classTeacher: Teacher;

  @ManyToMany(() => Teacher)
  @JoinTable({
    name: 'class_level_teachers',
    joinColumn: {
      name: 'class_level_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'teacher_id',
      referencedColumnName: 'id',
    },
  })
  teachers: Teacher[];

  @ManyToMany(() => Student, (student) => student.classLevels)
  @JoinTable({
    name: 'class_level_students',
    joinColumn: {
      name: 'class_level_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'student_id',
      referencedColumnName: 'id',
    },
  })
  students: Student[];
}
