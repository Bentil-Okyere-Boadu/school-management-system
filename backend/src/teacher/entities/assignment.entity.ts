import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Topic } from 'src/curriculum/entities/topic.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { Teacher } from 'src/teacher/teacher.entity';

export type AssignmentState = 'draft' | 'published';

@Entity()
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({ type: 'int' })
  maxScore: number;

  @Column({ type: 'varchar', default: 'draft' })
  state: AssignmentState;

  @Column({ nullable: true })
  attachmentPath?: string;

  @Column({ nullable: true })
  attachmentMediaType?: string;

  @ManyToOne(() => Topic, { eager: true, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @ManyToOne(() => ClassLevel, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_level_id' })
  classLevel: ClassLevel;

  @ManyToOne(() => Teacher, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
