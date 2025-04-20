import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { CurrentUser } from './current-user.decorator';
import { User } from './user.entity';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('super_admin', 'admin')
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: User) {
    return this.userService.create(createUserDto, user);
  }

  @Get()
  @Roles('super_admin', 'admin')
  findAll(@CurrentUser() user: User) {
    return this.userService.findAll(user);
  }

  @Get(':id')
  @Roles('super_admin', 'admin')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.userService.findOne(id, user);
  }
}
