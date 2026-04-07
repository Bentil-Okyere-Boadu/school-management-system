import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateFeeStructureDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  feeTitle: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  feeType: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({
    default: true,
    description:
      'If false, parents cannot pay this fee via USSD; Hubtel balance and allocation skip it.',
  })
  @IsOptional()
  @IsBoolean()
  allowUssdPayment?: boolean = true;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  classLevelIds?: string[];
}
