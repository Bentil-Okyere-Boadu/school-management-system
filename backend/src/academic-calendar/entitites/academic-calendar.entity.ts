import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { School } from 'src/school/school.entity';
import { AcademicTerm } from './academic-term.entity';

@Entity()
export class AcademicCalendar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  school: School;

  @OneToMany(() => AcademicTerm, (term) => term.academicCalendar, {
    cascade: true,
    eager: true,
  })
  terms: AcademicTerm[];
}
