import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SchoolProvisioningStatus } from 'src/tenant/school-provisioning-status';

@Entity()
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  calendlyUrl: string;

  @Column({ type: 'varchar', nullable: true })
  logoPath: string | null;

  @Column({ type: 'varchar', nullable: true })
  mediaType: string | null;

  logoUrl?: string;

  @Column({ nullable: true, unique: true })
  schoolCode: string;

  @Column({ type: 'float', default: 30 })
  classScorePercentage: number;

  @Column({ type: 'float', default: 70 })
  examScorePercentage: number;

  @Column({ type: 'varchar', nullable: true })
  hubtelClientId: string | null;

  @Column({ type: 'varchar', nullable: true })
  hubtelClientSecretEnc: string | null;

  @Column({ type: 'varchar', nullable: true })
  hubtelCollectionAccountNumber: string | null;

  @Column({ type: 'boolean', default: false })
  hubtelMerchantActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  paymentSetupRequestedAt: Date | null;

  @Column({ type: 'boolean', default: true })
  parentShowScores: boolean;

  @Column({ type: 'boolean', default: true })
  parentShowGrades: boolean;

  @Column({ type: 'boolean', default: true })
  parentShowLabels: boolean;

  @Column({ type: 'boolean', default: true })
  parentShowFeedback: boolean;

  @Column({ type: 'varchar', nullable: true, unique: true })
  schemaName: string | null;

  @Column({
    type: 'varchar',
    default: SchoolProvisioningStatus.NotProvisioned,
  })
  provisioningStatus: SchoolProvisioningStatus;

  @Column({ type: 'timestamptz', nullable: true })
  provisionedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  lastProvisionError: string | null;

  @Column({ type: 'boolean', default: false })
  isDisabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
