import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAcademicCalendarDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}
