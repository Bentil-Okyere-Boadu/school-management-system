import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { SubjectCatalog } from '../../subject/subject-catalog.entity';
import { AcademicTerm } from '../../academic-calendar/entitites/academic-term.entity';
import { Curriculum } from './curriculum.entity';
import { Subtopic } from './subtopic.entity';

@Entity()
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  order: number; // For ordering topics within a subject catalog

  @Column({ type: 'date', nullable: true })
  plannedStartDate: Date | null;

  @Column({ type: 'date', nullable: true })
  plannedEndDate: Date | null;

  @ManyToOne(() => SubjectCatalog, (subjectCatalog) => subjectCatalog.topics, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  subjectCatalog: SubjectCatalog;

  @ManyToOne(() => Curriculum, (curriculum) => curriculum.topics, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  curriculum: Curriculum | null;

  /** Source of truth for which term this topic belongs to; backfilled from curriculum.academicTerm when possible. */
  @ManyToOne(() => AcademicTerm, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_term_id' })
  academicTerm: AcademicTerm | null;

  @OneToMany(() => Subtopic, (subtopic) => subtopic.topic, { cascade: true })
  subtopics: Subtopic[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 'admin' })
  createdBy: string;
}
