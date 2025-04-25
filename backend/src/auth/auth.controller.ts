import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guards';
import { User } from '../user/user.entity'; // <-- import your User entity
import { CreateUserDto } from '../user/dto/create-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { InviteStudentDto } from './dto/invite-student.dto';
import { InviteTeacherDto } from './dto/invite-teacher.dto';
import { CurrentUser } from '../user/current-user.decorator';
import { InvitationService } from './service/invitation.service';
import { CredentialLoginDto } from './dto/credential-login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private invitationService: InvitationService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: { user: User }) {
    return this.authService.login(req.user);
  }

  @Post('login/credentials')
  loginWithCredentials(@Body() credentialLoginDto: CredentialLoginDto) {
    const identifier = credentialLoginDto.id || credentialLoginDto.email;

    return this.authService.loginWithCredentials(
      credentialLoginDto.pin,
      identifier,
    );
  }

  @Post('signup/super-admin')
  signupSuperAdmin(@Body() createUserDto: CreateUserDto) {
    return this.authService.signupSuperAdmin(createUserDto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: { email: string }) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: { token: string; password: string }) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('invite/student')
  inviteStudent(
    @Body() inviteStudentDto: InviteStudentDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.invitationService.inviteStudent(inviteStudentDto, currentUser);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('invite/teacher')
  inviteTeacher(
    @Body() inviteTeacherDto: InviteTeacherDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.invitationService.inviteTeacher(inviteTeacherDto, currentUser);
  }
}
