import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { GradingScheme } from './grading-scheme.entity';

@Entity()
export class GradingSchemeBand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  label: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column('float')
  minScore: number;

  @Column('float')
  maxScore: number;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => GradingScheme, (scheme) => scheme.bands, {
    onDelete: 'CASCADE',
  })
  scheme: GradingScheme;
}
