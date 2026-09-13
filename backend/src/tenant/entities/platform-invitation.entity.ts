import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'platform_invitation' })
export class PlatformInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  token: string;

  @Column('uuid')
  schoolId: string;

  @Column()
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: 'school_admin' })
  userType: 'school_admin' | 'teacher' | 'student';

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ default: false })
  accepted: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
