import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { School } from '../../school/school.entity';
import { Event } from './event.entity';

@Entity()
export class EventCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  color: string; // Hex color code for calendar display

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => School, (school) => school.eventCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  school: School;

  @OneToMany(() => Event, (event) => event.category)
  events: Event[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


