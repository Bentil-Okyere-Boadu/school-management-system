import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateHolidayDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;
} 