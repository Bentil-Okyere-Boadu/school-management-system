import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  VirtualColumn,
} from 'typeorm';
import { Admission } from './admission.entity';

@Entity()
export class Guardian {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  relationship: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  dob: string;

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ nullable: true })
  streetAddress: string;

  @Column({ nullable: true })
  boxAddress: string;

  @Column({ nullable: true })
  guardianPhone: string;

  @Column({ nullable: true })
  guardianOtherPhone: string;

  @Column({ nullable: true })
  guardianOtherPhoneOptional: string;

  // Headshot fields
  @Column({ nullable: true })
  headshotPath: string;

  @Column({ nullable: true })
  headshotMediaType: string;

  @VirtualColumn({
    query: (alias) => `(NULL)`, // Placeholder, handled in code
  })
  headshotUrl?: string;

  @ManyToOne(() => Admission, (admission) => admission.guardians, {
    onDelete: 'CASCADE',
  })
  admission: Admission;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
