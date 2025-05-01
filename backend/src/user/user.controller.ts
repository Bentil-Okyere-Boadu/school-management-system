import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { CurrentUser } from './current-user.decorator';
import { User } from './user.entity';
import { UserService } from './user.service';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('super_admin', 'school_admin')
  findAll(@CurrentUser() user: User) {
    return this.userService.findAll(user);
  }

  @Get(':id')
  @Roles('super_admin', 'school_admin')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.userService.findOne(id, user);
  }
}
