import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { AcademicTerm } from './academic-term.entity';

@Entity()
export class Holiday {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'date' })
  date: string;

  @ManyToOne(() => AcademicTerm, (term) => term.holidays, {
    onDelete: 'CASCADE',
  })
  term: AcademicTerm;
}
