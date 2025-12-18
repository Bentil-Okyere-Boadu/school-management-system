import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsArray,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { EventVisibility } from '../entities/planner-event.entity';

export class CreatePlannerEventDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @IsNotEmpty()
  @IsEnum(EventVisibility)
  visibility: EventVisibility;

  @ValidateIf((o) => o.visibility === EventVisibility.CLASS)
  @IsArray()
  @IsUUID('4', { each: true })
  classLevelIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];

  @IsOptional()
  @IsBoolean()
  hasReminder?: boolean;

  @ValidateIf((o) => o.hasReminder === true)
  @IsDateString()
  reminderDate?: string;
}

