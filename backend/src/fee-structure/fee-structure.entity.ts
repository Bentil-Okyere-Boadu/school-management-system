import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { School } from '../school/school.entity';
import { ClassLevel } from '../class-level/class-level.entity';

@Entity()
export class FeeStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ nullable: true })
  feeTitle: string;

  @Column()
  feeType: string;

  @Column('float')
  amount: number;

  // This field indicates the student category the fee applies to
  @Column({ nullable: true })
  appliesTo?: 'all' | 'new' | 'continuing';

  @Column({ nullable: true, type: 'date' })
  dueDate?: string;

  @ManyToOne(() => School, (school) => school.feeStructures, {
    onDelete: 'CASCADE',
  })
  school: School;

  @ManyToMany(() => ClassLevel)
  @JoinTable()
  classLevels?: ClassLevel[];
}
