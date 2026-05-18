import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class RequestPaymentSetupDto {
  @ApiPropertyOptional({ description: 'Reply-to contact (optional)' })
  @IsOptional()
  @ValidateIf((o: { contactEmail?: string }) => Boolean(o.contactEmail?.trim()))
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Message for the platform team (optional)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
