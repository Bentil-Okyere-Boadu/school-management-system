import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2025-12-31T09:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({ example: '2025-12-31T17:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isAllDay?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Event category UUID' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ enum: VisibilityScope })
  @IsEnum(VisibilityScope)
  @IsNotEmpty()
  visibilityScope: VisibilityScope;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    return [value];
  })
  targetClassLevelIds?: string[];

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    return [value];
  })
  targetSubjectIds?: string[];

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        reminderTime: { type: 'string', format: 'date-time' },
        notificationType: { type: 'string', enum: ['email', 'sms', 'both'] },
      },
    },
  })
  @IsArray()
  @IsOptional()
  reminders?: {
    reminderTime: string;
    notificationType?: 'email' | 'sms' | 'both';
  }[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  sendNotifications?: boolean;
}


