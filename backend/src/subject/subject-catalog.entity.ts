import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { School } from '../school/school.entity';
import { Subject } from './subject.entity';

@Entity()
export class SubjectCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @ManyToOne(() => School, { eager: true, nullable: false })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @OneToMany(() => Subject, (subject) => subject.subjectCatalog)
  subjects: Subject[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 