import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class HubtelReceiveMoneyCallbackDataDto {
  @ApiProperty()
  @IsNumber()
  Amount: number;

  @ApiProperty()
  @IsNumber()
  Charges: number;

  @ApiProperty()
  @IsNumber()
  AmountAfterCharges: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  AmountCharged?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  Description?: string;

  @ApiProperty()
  @IsString()
  ClientReference: string;

  @ApiProperty()
  @IsString()
  TransactionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ExternalTransactionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  OrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  PaymentDate?: string;
}

export class HubtelReceiveMoneyCallbackDto {
  @ApiProperty({ description: 'Hubtel response code (e.g. 0000, 2001)' })
  @IsString()
  ResponseCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  Message?: string;

  @ApiProperty({ type: () => HubtelReceiveMoneyCallbackDataDto })
  @ValidateNested()
  @Type(() => HubtelReceiveMoneyCallbackDataDto)
  Data: HubtelReceiveMoneyCallbackDataDto;
}
