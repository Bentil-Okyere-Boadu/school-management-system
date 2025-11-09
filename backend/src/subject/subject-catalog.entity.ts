import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { School } from '../school/school.entity';
import { Subject } from './subject.entity';
import { Curriculum } from '../curriculum/entities/curriculum.entity';
import { Topic } from '../curriculum/entities/topic.entity';

@Entity()
export class SubjectCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => School, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @OneToMany(() => Subject, (subject) => subject.subjectCatalog, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  subjects: Subject[];

  @ManyToMany(() => Curriculum, (curriculum) => curriculum.subjectCatalogs, {
    cascade: false,
  })
  curricula: Curriculum[];

  @OneToMany(() => Topic, (topic) => topic.subjectCatalog, {
    cascade: true,
    eager: false,
  })
  topics: Topic[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
