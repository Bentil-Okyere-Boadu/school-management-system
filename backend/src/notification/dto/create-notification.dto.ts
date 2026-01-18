import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { NotificationType } from '../notification.entity';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsEnum(NotificationType, {
    message: `type must be one of the following values: ${Object.values(NotificationType).join(', ')}`,
  })
  @IsNotEmpty()
  type: NotificationType;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsUUID()
  schoolId: string;
}