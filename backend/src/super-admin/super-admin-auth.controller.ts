import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { SuperAdminLocalAuthGuard } from './guards/super-admin-local-auth.guard';
import { SuperAdmin } from './super-admin.entity';

@Controller('super-admin/auth')
export class SuperAdminAuthController {
  constructor(private superAdminAuthService: SuperAdminAuthService) {}

  @UseGuards(SuperAdminLocalAuthGuard)
  @Post('login')
  login(@Request() req: { user: SuperAdmin }) {
    return this.superAdminAuthService.login(req.user);
  }

  @Post('signup')
  async signup(@Body() createSuperAdminDto: CreateSuperAdminDto) {
    return this.superAdminAuthService.signupSuperAdmin(createSuperAdminDto);
  }
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: { email: string }) {
    return this.superAdminAuthService.forgotAdminPassword(
      forgotPasswordDto.email,
    );
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: { token: string; password: string }) {
    return this.superAdminAuthService.resetAdminPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }
}
