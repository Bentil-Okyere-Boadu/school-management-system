import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { SuperAdminLocalAuthGuard } from './guards/super-admin-local-auth.guard';
import { SuperAdmin } from './super-admin.entity';

@Controller('super-admin/auth')
export class SuperAdminAuthController {
  constructor(private readonly superAdminAuthService: SuperAdminAuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(SuperAdminLocalAuthGuard)
  @Post('login')
  login(@Request() req: { user: SuperAdmin }) {
    return this.superAdminAuthService.login(req.user);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 signups per minute
  @Post('signup')
  async signup(@Body() createSuperAdminDto: CreateSuperAdminDto) {
    return this.superAdminAuthService.signupSuperAdmin(createSuperAdminDto);
  }
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: { email: string }) {
    return this.superAdminAuthService.forgotAdminPassword(
      forgotPasswordDto.email,
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: { token: string; password: string }) {
    return this.superAdminAuthService.resetAdminPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }
}
