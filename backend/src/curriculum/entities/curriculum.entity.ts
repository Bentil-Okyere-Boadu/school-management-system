import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubjectCatalog } from '../../subject/subject-catalog.entity';
import { School } from '../../school/school.entity';
import { AcademicTerm } from '../../academic-calendar/entitites/academic-term.entity';
import { Topic } from './topic.entity';

@Entity()
export class Curriculum {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(
    () => SubjectCatalog,
    (subjectCatalog) => subjectCatalog.curricula,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  subjectCatalog: SubjectCatalog;

  @ManyToOne(() => School, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  school: School;

  @ManyToOne(() => AcademicTerm, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  academicTerm: AcademicTerm;

  @OneToMany(() => Topic, (topic) => topic.curriculum, {
    cascade: true,
    eager: false,
  })
  topics: Topic[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
