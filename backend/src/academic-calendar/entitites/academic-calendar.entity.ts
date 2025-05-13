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
  name: string; // e.g. "2024/2025 Academic Year"

  @ManyToOne(() => School, (school) => school.academicCalendars, {
    //   onDelete: 'CASCADE',
  })
  school: School;

  @OneToMany(() => AcademicTerm, (term) => term.academicCalendar, {
    //cascade: true,
  })
  terms: AcademicTerm[];
}
