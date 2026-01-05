import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { SchoolAdmin } from '../../school-admin/school-admin.entity';
import { Teacher } from '../../teacher/teacher.entity';
import { Student } from '../../student/student.entity';
import { SuperAdmin } from '../../super-admin/super-admin.entity';

export type UserEntity = SchoolAdmin | Teacher | Student | SuperAdmin;

@Entity()
@Index(['token'], { unique: true })
@Index(['userId', 'userType'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @Column()
  userId: string;

  @Column()
  userType: 'school_admin' | 'teacher' | 'student' | 'super_admin';

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  isRevoked: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

