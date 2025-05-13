import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  CreateDateColumn,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { School } from '../school/school.entity';
import { Role } from 'src/role/role.entity';
import { Profile } from 'src/profile/profile.entity';

@Entity()
export class SchoolAdmin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ default: 'pending' })
  status: string;

  @ManyToOne(() => Role, { eager: true })
  @JoinColumn()
  role: Role;

  @Column({ nullable: true })
  invitationToken: string;

  @Column({ nullable: true })
  invitationExpires: Date;

  @Column({ default: false })
  isInvitationAccepted: boolean;

  @Column({ nullable: true })
  resetPasswordToken: string;

  @ManyToOne(() => School, (school) => school.admins, {
    // onDelete: 'CASCADE',
    eager: true,
  })
  school: School;
  @OneToOne(() => Profile, (profile) => profile.schoolAdmin)
  profile: Profile;
  @Column({ nullable: true })
  resetPasswordExpires: Date;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ nullable: true, unique: true })
  adminId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
