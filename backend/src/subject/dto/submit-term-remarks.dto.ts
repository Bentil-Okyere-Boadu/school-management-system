import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SubmitTermRemarksDto {
  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  remarks: string;
}
