// src/super-admin/super-admin.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Role } from '../role/role.entity';
import { Profile } from 'src/profile/profile.entity';

@Entity()
export class SuperAdmin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'active' })
  status: string;

  @OneToOne(() => Profile, (profile) => profile.superAdmin, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @ManyToOne(() => Role, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  role: Role;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({ nullable: true })
  resetPasswordExpires: Date;
}
