import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  IsDateString,
} from 'class-validator';
import {
  ReminderType,
  ReminderStatus,
} from '../entities/message-reminder.entity';

export class CreateMessageReminderDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(ReminderType)
  type?: ReminderType;

  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;

  @IsOptional()
  @IsBoolean()
  sendToStudents?: boolean;

  @IsOptional()
  @IsBoolean()
  sendToParents?: boolean;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetStudentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetClassLevelIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetGradeIds?: string[];
}
