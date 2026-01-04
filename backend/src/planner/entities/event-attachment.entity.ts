import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Event } from './event.entity';

@Entity()
export class EventAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, (event) => event.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  event: Event;

  @Column()
  filePath: string; // S3 path

  @Column()
  fileName: string;

  @Column('bigint')
  fileSize: number; // in bytes

  @Column()
  mediaType: string; // MIME type

  @CreateDateColumn()
  uploadedAt: Date;
}


