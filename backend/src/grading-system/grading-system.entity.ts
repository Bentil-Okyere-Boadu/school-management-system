import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { School } from '../school/school.entity';

@Entity()
export class GradingSystem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  grade: string;

  @Column('float')
  minRange: number;

  @Column('float')
  maxRange: number;

  @ManyToOne(() => School, (school) => school.gradingSystems, {
    onDelete: 'CASCADE',
  })
  school: School;
}
