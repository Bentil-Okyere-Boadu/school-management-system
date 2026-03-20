import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Topic } from './topic.entity';
import { Subject } from '../../subject/subject.entity';
import { AcademicTerm } from '../../academic-calendar/entitites/academic-term.entity';

/**
 * Notes on a curriculum topic for admin–teacher communication.
 * - Admins can add notes (optionally scoped to a Subject: teacher + class + catalog).
 * - Teachers can reply (parentId points to the admin note).
 * - subject is null = school-wide note; set = note for that teaching assignment (Subject).
 * - academicTerm scopes notes to a term when curricula/topics are reused across terms.
 */
@Entity()
export class CurriculumTopicNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Topic, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @ManyToOne(() => Subject, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject | null; // null = school-wide note

  @ManyToOne(() => AcademicTerm, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_term_id' })
  academicTerm: AcademicTerm | null;

  @Column({ type: 'varchar', length: 255 })
  authorId: string;

  @Column({ type: 'varchar', length: 50 })
  authorRole: string; // e.g. school_admin, teacher

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => CurriculumTopicNote, (note) => note.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: CurriculumTopicNote | null;

  @OneToMany(() => CurriculumTopicNote, (note) => note.parent)
  replies: CurriculumTopicNote[];
}
