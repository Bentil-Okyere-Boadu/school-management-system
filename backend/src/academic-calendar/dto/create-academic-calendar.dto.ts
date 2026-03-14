import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAcademicCalendarDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;
}
