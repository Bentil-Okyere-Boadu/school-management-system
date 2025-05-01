import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guards';
import { User } from '../user/user.entity';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { CredentialLoginDto } from './dto/credential-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}
