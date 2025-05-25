import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  VirtualColumn,
} from 'typeorm';
import { School } from '../school/school.entity';

@Entity()
export class AdmissionPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @VirtualColumn({
    query: (alias) => `(NULL)`, // Placeholder: handled dynamically in code
  })
  documentUrl?: string;
  @Column({ nullable: true })
  documentPath?: string;

  @ManyToOne(() => School, (school) => school.admissionPolicies, {
    onDelete: 'CASCADE',
  })
  school: School;
}
