import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessageReminderService } from './message-reminder.service';
import { CreateMessageReminderDto } from './dto/create-message-reminder.dto';
import { UpdateMessageReminderDto } from './dto/update-message-reminder.dto';
import { SearchMessageReminderDto } from './dto/search-message-reminder.dto';
import { SchoolAdminJwtAuthGuard } from '../school-admin/guards/school-admin-jwt-auth.guard';
import { SchoolAdminSchoolGuard } from '../school-admin/guards/school-admin-school.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';

@Controller('message-reminders')
@UseGuards(
  SchoolAdminJwtAuthGuard,
  ActiveUserGuard,
  RolesGuard,
  SchoolAdminSchoolGuard,
)
@Roles(Role.SchoolAdmin)
export class MessageReminderController {
  constructor(
    private readonly messageReminderService: MessageReminderService,
  ) {}

  @Post()
  create(
    @Body() createDto: CreateMessageReminderDto,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.messageReminderService.create(
      createDto,
      admin.id,
      admin.school.id,
    );
  }

  @Get()
  findAll(@Query() searchDto: SearchMessageReminderDto) {
    return this.messageReminderService.findAll(searchDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messageReminderService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateMessageReminderDto) {
    return this.messageReminderService.update(id, updateDto);
  }

  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.messageReminderService.toggleStatus(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messageReminderService.remove(id);
  }

  @Post(':id/send-now')
  sendNow(@Param('id') id: string) {
    return this.messageReminderService
      .findOne(id)
      .then((reminder) =>
        this.messageReminderService.sendReminderNotifications(reminder),
      );
  }
}
