import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum HubtelResponseType {
  RESPONSE = 'response',
  RELEASE = 'release',
}

export enum HubtelDataType {
  DISPLAY = 'display',
  INPUT = 'input',
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
}
