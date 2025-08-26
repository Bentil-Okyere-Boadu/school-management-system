import { IsUrl, IsNotEmpty } from 'class-validator';

export class UpdateCalendlyUrlDto {
  @IsNotEmpty()
  @IsUrl()
  calendlyUrl: string;

  @IsNotEmpty()
  schoolId: string;
}