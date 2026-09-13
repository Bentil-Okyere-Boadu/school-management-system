import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SuperAdmin } from 'src/super-admin/super-admin.entity';

@Entity({ name: 'super_admin_profile' })
export class SuperAdminProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  avatarPath?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phoneContact?: string;

  @OneToOne(() => SuperAdmin, (admin) => admin.profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  superAdmin: SuperAdmin;
}
