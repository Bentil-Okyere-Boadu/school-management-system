import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsObject, IsOptional, IsString, ValidateIf } from 'class-validator';

export enum HubtelResponseType {
  RESPONSE = 'response',
  RELEASE = 'release',
  ADD_TO_CART = 'AddToCart',
}

export enum HubtelDataType {
  DISPLAY = 'display',
  INPUT = 'input',
}

export class HubtelAddToCartItemDto {
  @ApiProperty()
  @IsString()
  ItemName: string;

  @ApiProperty()
  @IsNumber()
  Qty: number;

  @ApiProperty()
  @IsNumber()
  Price: number;
}

export class HubtelInteractionResponseDto {
  @ApiProperty()
  @IsString()
  SessionId: string;

  @ApiProperty({ enum: HubtelResponseType })
  @IsEnum(HubtelResponseType)
  Type: HubtelResponseType;

  @ApiProperty()
  @IsString()
  Message: string;

  @ApiProperty()
  @IsString()
  Label: string;

  @ApiProperty({ enum: HubtelDataType })
  @IsEnum(HubtelDataType)
  DataType: HubtelDataType;

  @ApiProperty()
  @IsString()
  FieldType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ClientState?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ServiceCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  Mask?: string;

  @ApiPropertyOptional({ type: () => HubtelAddToCartItemDto })
  @ValidateIf((obj) => obj.Type === HubtelResponseType.ADD_TO_CART)
  @IsObject()
  Item?: HubtelAddToCartItemDto;
}
