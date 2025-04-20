import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guards';
import { User } from '../user/user.entity'; // <-- import your User entity
import { CreateUserDto } from '../user/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: { user: User }) {
    return this.authService.login(req.user);
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
