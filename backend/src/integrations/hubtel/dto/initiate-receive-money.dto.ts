import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Hubtel Direct Receive Money supported mobile money channels (Ghana).
 */
export enum HubtelMobileMoneyChannel {
  MTN = 'mtn-gh',
  TELECEL = 'vodafone-gh',
  AIRTELTIGO = 'tigo-gh',
}

/** Body for student-initiated OTP checkout (requires student Bearer JWT). */
export class StudentInitiatePaymentDto {
  @ApiProperty({
    description: 'Amount in GHS (max 2 decimal places)',
    example: 50.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  amount: number;

  @ApiProperty({
    description:
      "Customer's mobile money number in international format (e.g. 233249111411)",
    example: '233249111411',
  })
  @IsString()
  @Matches(/^233\d{9}$/, {
    message: 'mobileNumber must be in international format, e.g. 233XXXXXXXXX',
  })
  mobileNumber: string;

  @ApiProperty({ enum: HubtelMobileMoneyChannel })
  @IsEnum(HubtelMobileMoneyChannel)
  channel: HubtelMobileMoneyChannel;

  @ApiPropertyOptional({
    description:
      'Optional fee structure id to prioritise during allocation when payment is fulfilled',
  })
  @IsOptional()
  @IsString()
  targetFeeStructureId?: string;

  @ApiPropertyOptional({
    description:
      'Optional student fee obligation id (specific period line); takes precedence for allocation',
  })
  @IsOptional()
  @IsUUID('4')
  targetStudentFeeObligationId?: string;

  @ApiPropertyOptional({ description: 'Optional payer display name' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  customerName?: string;

  @ApiPropertyOptional({ description: 'Optional payer email' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;
}

/**
 * Body for the OTP verification + payment trigger endpoint.
 */
export class VerifyAndPayPublicPaymentDto {
  @ApiProperty({ description: 'OTP request id returned from /initiate' })
  @IsString()
  @IsNotEmpty()
  otpRequestId: string;

  @ApiProperty({ description: '6-digit OTP code' })
  @IsString()
  @Matches(/^\d{4,8}$/)
  otp: string;
}

/**
 * Direct Receive Money request body sent server-to-server to Hubtel.
 * Mirrors the Hubtel Direct Receive Money API spec.
 */
export interface HubtelDirectReceiveMoneyRequest {
  CustomerName?: string;
  CustomerMsisdn: string;
  CustomerEmail?: string;
  Channel: HubtelMobileMoneyChannel;
  Amount: number;
  PrimaryCallbackUrl: string;
  Description: string;
  ClientReference: string;
}

/**
 * Direct Receive Money response from Hubtel.
 */
export interface HubtelDirectReceiveMoneyResponse {
  Message?: string;
  ResponseCode?: string;
  Data?: {
    TransactionId?: string;
    Description?: string;
    ClientReference?: string;
    Amount?: number;
    Charges?: number;
    AmountAfterCharges?: number;
    AmountCharged?: number;
    DeliveryFee?: number;
  };
}
