import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { HubtelMobileMoneyChannel } from 'src/integrations/hubtel/dto/initiate-receive-money.dto';

export class ParentPaymentChildDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  amount: number;
}

export class ParentInitiatePaymentDto {
  @ApiProperty({ type: [ParentPaymentChildDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ParentPaymentChildDto)
  children: ParentPaymentChildDto[];

  @ApiProperty({ example: '233249111411' })
  @IsString()
  @Matches(/^233\d{9}$/, {
    message: 'mobileNumber must be in international format, e.g. 233XXXXXXXXX',
  })
  mobileNumber: string;

  @ApiProperty({ enum: HubtelMobileMoneyChannel })
  @IsEnum(HubtelMobileMoneyChannel)
  channel: HubtelMobileMoneyChannel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerEmail?: string;
}
