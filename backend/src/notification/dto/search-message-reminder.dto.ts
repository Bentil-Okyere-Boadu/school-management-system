import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import {
  ReminderStatus,
  ReminderType,
} from '../entities/message-reminder.entity';

export class SearchMessageReminderDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;

  @IsOptional()
  @IsEnum(ReminderType)
  type?: ReminderType;

  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}
