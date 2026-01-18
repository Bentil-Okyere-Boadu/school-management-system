import { PartialType } from '@nestjs/mapped-types';
import { CreateMessageReminderDto } from './create-message-reminder.dto';

export class UpdateMessageReminderDto extends PartialType(
  CreateMessageReminderDto,
) {}
