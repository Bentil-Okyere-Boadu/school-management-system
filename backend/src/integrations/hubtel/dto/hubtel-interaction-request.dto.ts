import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export enum HubtelPushType {
  INITIATION = 'Initiation',
  RESPONSE = 'Response',
  TIMEOUT = 'Timeout',
}

export enum HubtelPlatform {
  USSD = 'USSD',
  WEBSTORE = 'Webstore',
  HUBTEL_APP = 'Hubtel-App',
}

export class HubtelInteractionRequestDto {
  @ApiProperty({ enum: HubtelPushType })
  @IsEnum(HubtelPushType)
  Type: HubtelPushType;

  @ApiProperty()
  @IsString()
  Message: string;

  @ApiProperty()
  @IsString()
  ServiceCode: string;

  @ApiProperty()
  @IsString()
  Operator: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  ClientState?: string;

  @ApiProperty()
  @IsString()
  Mobile: string;

  @ApiProperty()
  @IsString()
  SessionId: string;

  @ApiProperty()
  @IsInt()
  Sequence: number;

  @ApiProperty({ enum: HubtelPlatform })
  @IsEnum(HubtelPlatform)
  Platform: HubtelPlatform;

  /** Present on some Hubtel USSD variants (e.g. Vodafone); ignored by our handler. */
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Allow()
  MetaData?: unknown;
}
