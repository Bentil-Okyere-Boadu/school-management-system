import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { School } from '../school/school.entity';
import { ClassLevel } from '../class-level/class-level.entity';
import { GradingSchemeBand } from './grading-scheme-band.entity';

export type GradingSchemeStatus = 'draft' | 'active' | 'inactive';
export type GradingSchemeRounding = 'none' | 'nearest' | 'up' | 'down';
export type GradingSchemeScopeType = 'school' | 'classLevels';

@Entity()
export class GradingScheme {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'draft' })
  status: GradingSchemeStatus;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column('float', { default: 0 })
  scoreScaleMin: number;

  @Column('float', { default: 100 })
  scoreScaleMax: number;

  @Column('float', { default: 50 })
  passMark: number;

  @Column({ type: 'varchar', default: 'nearest' })
  rounding: GradingSchemeRounding;

  @Column({ default: false })
  allowManualOverride: boolean;

  @Column({ type: 'varchar', nullable: true })
  effectiveFrom: string | null;

  @Column({ type: 'varchar', default: 'school' })
  scopeType: GradingSchemeScopeType;

  @Column({ type: 'uuid', nullable: true })
  createdById: string | null;

  @Column({ type: 'varchar', nullable: true })
  createdByName: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedById: string | null;

  @Column({ type: 'varchar', nullable: true })
  updatedByName: string | null;

  @Column({ type: 'uuid', nullable: true })
  activatedById: string | null;

  @Column({ type: 'varchar', nullable: true })
  activatedByName: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  activatedAt: Date | null;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  school: School;

  @OneToMany(() => GradingSchemeBand, (band) => band.scheme, {
    cascade: true,
    eager: true,
  })
  bands: GradingSchemeBand[];

  @ManyToMany(() => ClassLevel, { eager: true })
  @JoinTable({
    name: 'grading_scheme_class_levels',
    joinColumn: { name: 'grading_scheme_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'class_level_id',
      referencedColumnName: 'id',
    },
  })
  classLevels: ClassLevel[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
