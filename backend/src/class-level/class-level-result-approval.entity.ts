import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  Unique,
} from 'typeorm';
import { ClassLevel } from './class-level.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';

@Entity()
@Unique(['classLevel', 'academicTerm'])
export class ClassLevelResultApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClassLevel, { eager: true })
  classLevel: ClassLevel;

  @ManyToOne(() => AcademicTerm, { eager: true })
  academicTerm: AcademicTerm;

  @Column({ default: false })
  approved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;
}
