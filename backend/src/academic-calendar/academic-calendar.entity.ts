import { School } from 'src/school/school.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class AcademicCalendar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  termName: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'text', nullable: true })
  events?: string; // JSON or text for events

  @ManyToOne(() => School, (school) => school.academicCalendars, {
    onDelete: 'CASCADE',
  })
  school: School;
}
