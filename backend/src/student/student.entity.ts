import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { School } from '../school/school.entity';
import { Role } from '../role/role.entity';
import { Profile } from 'src/profile/profile.entity';
import { Parent } from '../parent/parent.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity()
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column()
  password: string; // For PIN storage

  @ManyToOne(() => Role, { eager: true })
  @JoinColumn()
  role: Role;

  @ManyToOne(() => School, (school) => school.students, {
    //onDelete: 'CASCADE',
    eager: true,
  })
  school: School;

  @OneToOne(() => Profile, (profile) => profile.student, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  invitationToken: string;

  @Column({ nullable: true })
  invitationExpires: Date;

  @Column({ default: false })
  isInvitationAccepted: boolean;

  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({ nullable: true })
  resetPasswordExpires: Date;

  @Column({ unique: true })
  studentId: string; // Custom generated ID for student login

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Parent, (parent) => parent.student, {
    cascade: true,
    eager: true,
  })
  parents: Parent[];
}
