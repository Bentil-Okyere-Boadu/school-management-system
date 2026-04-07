import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentProvider } from './payment-transaction.entity';

@Entity()
export class PaymentProviderEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.HUBTEL,
  })
  provider: PaymentProvider;

  @Column()
  eventType: string;

  @Index({ unique: true })
  @Column({ unique: true })
  eventKey: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  sessionId: string | null;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  orderId: string | null;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
