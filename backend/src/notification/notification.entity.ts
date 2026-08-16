import { School } from 'src/school/school.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum NotificationType {
  Admission = 'admission',
  Attendance = 'attendance',
  Results = 'results',
  Fee = 'fee',
  General = 'general',
  ClassTeacherResultSubmission = 'classTeacherResultSubmission',
  ParentInvitation = 'parentInvitation',
  ParentAccepted = 'parentAccepted',
  ParentChildConfirmation = 'parentChildConfirmation',
  ParentChildConfirmed = 'parentChildConfirmed',
  ParentReviewRequired = 'parentReviewRequired',
  ParentAccessRevoked = 'parentAccessRevoked',
  AssignmentPublished = 'assignmentPublished',
  AssignmentUpdated = 'assignmentUpdated',
  AssignmentSubmitted = 'assignmentSubmitted',
  AssignmentGraded = 'assignmentGraded',
  CurriculumNote = 'curriculumNote',
  CurriculumNoteReply = 'curriculumNoteReply',
  GradesSubmitted = 'gradesSubmitted',
  ClassResultsSubmitted = 'classResultsSubmitted',
  ResultsReleased = 'resultsReleased',
  ResultsUnlocked = 'resultsUnlocked',
}

export enum NotificationRecipientRole {
  Teacher = 'teacher',
  Student = 'student',
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ default: NotificationType.General })
  type: NotificationType;

  @Column({ default: false })
  read: boolean;

  @Column({ type: 'varchar', nullable: true })
  recipientRole: NotificationRecipientRole | null;

  @Column({ type: 'uuid', nullable: true })
  recipientId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => School, (school) => school.admins, { eager: true })
  school: School;
}
