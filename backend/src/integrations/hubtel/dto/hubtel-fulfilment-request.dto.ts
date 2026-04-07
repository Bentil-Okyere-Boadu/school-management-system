import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class HubtelFulfilmentItemDto {
  @ApiProperty()
  @IsString()
  ItemId: string;

  @ApiProperty()
  @IsString()
  Name: string;

  @ApiProperty()
  @IsNumber()
  Quantity: number;

  @ApiProperty()
  @IsNumber()
  UnitPrice: number;
}

class HubtelFulfilmentPaymentDto {
  @ApiProperty()
  @IsString()
  PaymentType: string;

  @ApiProperty()
  @IsNumber()
  AmountPaid: number;

  @ApiProperty()
  @IsNumber()
  AmountAfterCharges: number;

  @ApiProperty()
  @IsDateString()
  PaymentDate: string;

  @ApiProperty()
  @IsString()
  PaymentDescription: string;

  @ApiProperty()
  @IsBoolean()
  IsSuccessful: boolean;
}

class HubtelOrderInfoDto {
  @ApiProperty()
  @IsString()
  CustomerMobileNumber: string;

  @ApiProperty()
  @IsOptional()
  CustomerEmail?: string | null;

  @ApiProperty()
  @IsString()
  CustomerName: string;

  @ApiProperty()
  @IsString()
  Status: string;

  @ApiProperty()
  @IsDateString()
  OrderDate: string;

  @ApiProperty()
  @IsString()
  Currency: string;

  @ApiProperty()
  @IsString()
  BranchName: string;

  @ApiProperty()
  @IsBoolean()
  IsRecurring: boolean;

  @ApiProperty()
  @IsOptional()
  RecurringInvoiceId?: string | null;

  @ApiProperty()
  @IsNumber()
  Subtotal: number;

  @ApiProperty({ type: () => [HubtelFulfilmentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HubtelFulfilmentItemDto)
  Items: HubtelFulfilmentItemDto[];

  @ApiProperty({ type: () => HubtelFulfilmentPaymentDto })
  @ValidateNested()
  @Type(() => HubtelFulfilmentPaymentDto)
  Payment: HubtelFulfilmentPaymentDto;
}

export class HubtelFulfilmentRequestDto {
  @ApiProperty()
  @IsString()
  SessionId: string;

  @ApiProperty()
  @IsString()
  OrderId: string;

  @ApiProperty()
  @IsObject()
  ExtraData: Record<string, unknown>;

  @ApiProperty({ type: () => HubtelOrderInfoDto })
  @ValidateNested()
  @Type(() => HubtelOrderInfoDto)
  OrderInfo: HubtelOrderInfoDto;
}
