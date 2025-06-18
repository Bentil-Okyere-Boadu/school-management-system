import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Student } from '../student/student.entity';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
