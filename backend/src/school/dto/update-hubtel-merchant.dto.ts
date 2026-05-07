import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Payload for SuperAdmin to set or rotate a school's Hubtel merchant credentials.
 *
 * The clientSecret is encrypted at rest (AES-256-GCM) and never echoed back.
 */
export class UpdateHubtelMerchantDto {
  @ApiProperty({ description: 'Hubtel API client id (Basic Auth username)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(128)
  clientId: string;

  @ApiProperty({
    description: 'Hubtel API client secret (Basic Auth password)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(256)
  clientSecret: string;

  @ApiProperty({
    description:
      "School's Hubtel Collection Account Number (used in URL path; determines settlement merchant)",
    example: '11684',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9_-]{1,32}$/, {
    message: 'collectionAccountNumber must be 1-32 alphanumeric characters',
  })
  collectionAccountNumber: string;

  @ApiPropertyOptional({
    description:
      'Whether the merchant configuration is active and may receive payments',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
