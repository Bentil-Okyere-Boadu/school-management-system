import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  VirtualColumn,
} from 'typeorm';
import { Admission } from './admission.entity';

@Entity()
export class PreviousSchoolResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @VirtualColumn({
    query: (alias) => `(NULL)`, // Placeholder, handled in code
  })
  fileUrl?: string;
  @Column()
  filePath: string;

  @Column({ nullable: true })
  mediaType: string;

  @ManyToOne(() => Admission, (admission) => admission.previousSchoolResults, {
    onDelete: 'CASCADE',
  })
  admission: Admission;
}
