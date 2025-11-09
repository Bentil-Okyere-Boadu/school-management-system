import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubjectCatalog } from '../../subject/subject-catalog.entity';

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

  @ManyToOne(() => SubjectCatalog, (subjectCatalog) => subjectCatalog.topics, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  subjectCatalog: SubjectCatalog;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
