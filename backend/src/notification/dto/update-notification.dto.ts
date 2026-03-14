import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationDto {
  @ApiPropertyOptional()
  read?: boolean;
}

export class MarkAsReadDto {
  read: boolean;
}