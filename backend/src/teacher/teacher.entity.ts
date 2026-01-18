import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToMany,
} from 'typeorm';
import { Role } from '../role/role.entity';
import { School } from '../school/school.entity';
import { Profile } from 'src/profile/profile.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';

@Entity()
export class Teacher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ unique: true })
  teacherId: string;

  @OneToOne(() => Profile, (profile) => profile.teacher, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  profile: Profile;
  @ManyToOne(() => Role, { eager: true, nullable: true, onDelete: 'SET NULL' })
  role: Role;

  @ManyToOne(() => School, (school) => school.teachers, {
    eager: true,
    onDelete: 'CASCADE',
  })
  school: School;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ default: false })
  isSuspended: boolean;

  @Column({ default: false })
  isInvitationAccepted: boolean;

  @Column({ nullable: true })
  invitationToken: string;

  @Column({ nullable: true, type: 'timestamp' })
  invitationExpires: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @ManyToMany(() => ClassLevel, (classLevel) => classLevel.teachers)
  classLevels: ClassLevel[];
}
