import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'tenant_directory' })
@Index(['loginKey', 'userType', 'schoolId'], { unique: true })
export class TenantDirectory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loginKey: string;

  @Column()
  userType: 'school_admin' | 'teacher' | 'student' | 'parent';

  @Column('uuid')
  schoolId: string;

  @Column('uuid')
  tenantUserId: string;

  @CreateDateColumn()
  createdAt: Date;
}
