import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { School } from '../school/school.entity';

@Entity()
export class AdmissionPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  documentUrl?: string;

  @ManyToOne(() => School, (school) => school.admissionPolicies, {
    onDelete: 'CASCADE',
  })
  school: School;
}
