import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { School } from 'src/school/school.entity';
import { PlannerEvent } from './planner-event.entity';

@Entity()
export class EventCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  color?: string; // Hex color code for calendar display

  @ManyToOne(() => School, (school) => school.eventCategories, {
    onDelete: 'CASCADE',
  })
  school: School;

  @OneToMany(() => PlannerEvent, (event) => event.category, {
    onDelete: 'SET NULL',
  })
  events: PlannerEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

