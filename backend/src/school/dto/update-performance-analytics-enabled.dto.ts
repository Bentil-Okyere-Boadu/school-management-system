import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdatePerformanceAnalyticsEnabledDto {
  @ApiProperty()
  @IsBoolean()
  performanceAnalyticsEnabled: boolean;
}
