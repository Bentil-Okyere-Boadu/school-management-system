import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type PreloginUserType = 'parent' | 'school_admin';

export type PreloginTokenPurpose =
  | 'password_reset'
  | 'parent_invitation'
  | 'child_confirmation';

@Entity({ name: 'platform_prelogin_token' })
export class PlatformPreloginToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  token: string;

  @Column('uuid')
  schoolId: string;

  @Column()
  userType: PreloginUserType;

  @Column()
  purpose: PreloginTokenPurpose;

  @Column('uuid')
  subjectId: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
