import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsNotEmpty, IsString } from 'class-validator';

export class UpdateCalendlyUrlDto {
  @ApiProperty({ example: 'https://calendly.com/school' })
  @IsNotEmpty()
  @IsUrl()
  calendlyUrl: string;

  @ApiProperty({ description: 'School UUID' })
  @IsNotEmpty()
  @IsString()
  schoolId: string;
}