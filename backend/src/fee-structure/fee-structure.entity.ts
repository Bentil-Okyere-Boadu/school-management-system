import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { School } from '../school/school.entity';
import { ClassLevel } from '../class-level/class-level.entity';

@Entity()
export class FeeStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  // This field links the fee to a specific class/level, or null for all classes
  @ManyToOne(() => ClassLevel, { nullable: true })
  classLevel?: ClassLevel;
}
