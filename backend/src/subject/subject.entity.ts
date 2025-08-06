import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubjectCatalog } from './subject-catalog.entity';
import { School } from '../school/school.entity';
import { Teacher } from '../teacher/teacher.entity';
import { ClassLevel } from '../class-level/class-level.entity';

@Entity()
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SubjectCatalog, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subject_catalog_id' })
  subjectCatalog: SubjectCatalog;

  @ManyToOne(() => Teacher, { eager: true, nullable: false })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @ManyToOne(() => School, { eager: true, nullable: false })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToMany(() => ClassLevel, { eager: true })
  @JoinTable({
    name: 'subject_class_levels',
    joinColumn: { name: 'subject_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'class_level_id', referencedColumnName: 'id' },
  })
  classLevels: ClassLevel[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
