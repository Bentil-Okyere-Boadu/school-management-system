import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { NotificationType } from '../notification.entity';

export class CreateNotificationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType, {
    message: `type must be one of the following values: ${Object.values(NotificationType).join(', ')}`,
  })
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ description: 'School UUID' })
  @IsNotEmpty()
  @IsUUID()
  schoolId: string;
}