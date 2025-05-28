import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AcademicCalendar } from './academic-calendar.entity';
import { Holiday } from './holiday.entity';

@Entity()
export class AcademicTerm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  termName: string; // e.g. "1st Semester"

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @ManyToOne(() => AcademicCalendar, (calendar) => calendar.terms, {
    onDelete: 'CASCADE',
  })
  academicCalendar: AcademicCalendar;

  @OneToMany(() => Holiday, (holiday) => holiday.term, {
    cascade: true,
    eager: true,
  })
  holidays: Holiday[];
}
