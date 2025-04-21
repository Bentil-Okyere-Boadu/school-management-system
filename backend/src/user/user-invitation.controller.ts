import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Get,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserInvitationService } from './user-invitation.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { User } from './user.entity';
import { CurrentUser } from './current-user.decorator';
import { SanitizeResponseInterceptor } from '../common/interceptors/sanitize-response.interceptor';

@Controller('user-invitations')
@UseInterceptors(SanitizeResponseInterceptor)
export class UserInvitationController {
  constructor(private userInvitationService: UserInvitationService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  async inviteUser(
    @Body() inviteUserDto: InviteUserDto,
    @CurrentUser() user: User,
  ) {
    return this.userInvitationService.inviteUser(inviteUserDto, user);
  }

  @Post('complete-registration')
  async completeRegistration(@Body() completeRegDto: CompleteRegistrationDto) {
    if (!completeRegDto.token || !completeRegDto.password) {
      throw new BadRequestException('Token and password are required');
    }

    await this.userInvitationService.completeRegistration(
      completeRegDto.token,
      completeRegDto.password,
    );

    return { success: true, message: 'Registration completed successfully' };
  }

  @Post('resend/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  async resendInvitation(
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    return this.userInvitationService.resendInvitation(userId, user);
  }
}
