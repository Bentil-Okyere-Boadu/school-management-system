import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsEnum,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { VisibilityScope } from '../entities/event.entity';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isAllDay?: boolean;

  @IsString()
  @IsOptional()
  location?: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsEnum(VisibilityScope)
  @IsNotEmpty()
  visibilityScope: VisibilityScope;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  targetClassLevelIds?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  targetSubjectIds?: string[];

  @IsArray()
  @IsOptional()
  reminders?: {
    reminderTime: string; // ISO date string
    notificationType?: 'email' | 'sms' | 'both';
  }[];
}


