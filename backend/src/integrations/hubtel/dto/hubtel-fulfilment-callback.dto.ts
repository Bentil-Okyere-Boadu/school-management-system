import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class HubtelFulfilmentCallbackDto {
  @ApiProperty()
  @IsString()
  SessionId: string;

  @ApiProperty()
  @IsString()
  OrderId: string;

  @ApiProperty({ enum: ['success', 'failed'] })
  @IsIn(['success', 'failed'])
  ServiceStatus: 'success' | 'failed';

  @ApiProperty()
  @IsOptional()
  MetaData?: Record<string, unknown> | null;
}
