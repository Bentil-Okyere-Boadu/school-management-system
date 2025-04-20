import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('super_admin', 'admin')
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.userService.create(createUserDto, req.user);
  }

  @Get()
  @Roles('super_admin', 'admin')
  findAll(@Request() req) {
    return this.userService.findAll(req.user);
  }

  @Get(':id')
  @Roles('super_admin', 'admin')
  findOne(@Param('id') id: string, @Request() req) {
    return this.userService.findOne(id, req.user);
  }
}
