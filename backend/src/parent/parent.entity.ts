import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne
} from 'typeorm';
import { Student } from '../student/student.entity';
import { Profile } from 'src/profile/profile.entity';

@Entity()
export class Parent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  relationship: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @ManyToOne(() => Student, (student) => student.parents, {
    onDelete: 'CASCADE',
  })
  student: Student;

  @OneToOne(() => Profile, (profile) => profile.parent, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
