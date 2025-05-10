import { School } from 'src/school/school.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  principalName?: string;

  @Column({ nullable: true })
  contactEmail?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  address?: string;

  @OneToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn()
  school: School;
}
