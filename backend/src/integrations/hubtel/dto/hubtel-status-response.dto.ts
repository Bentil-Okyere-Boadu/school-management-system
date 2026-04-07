import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class HubtelStatusDataDto {
  @ApiProperty()
  @IsString()
  date: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  transactionId: string;

  @ApiProperty()
  @IsString()
  externalTransactionId: string;

  @ApiProperty()
  @IsString()
  paymentMethod: string;

  @ApiProperty()
  @IsString()
  clientReference: string;

  @ApiProperty()
  @IsOptional()
  currencyCode?: string | null;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNumber()
  charges: number;

  @ApiProperty()
  @IsNumber()
  amountAfterCharges: number;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isFulfilled?: boolean | null;
}

export class HubtelStatusResponseDto {
  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  responseCode: string;

  @ApiProperty({ type: () => HubtelStatusDataDto })
  @ValidateNested()
  @Type(() => HubtelStatusDataDto)
  data: HubtelStatusDataDto;
}
