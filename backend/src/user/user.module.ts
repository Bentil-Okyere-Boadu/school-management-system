import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { RoleService } from 'src/role/role.service';
import { Role } from 'src/role/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [UserService, RoleService],
  controllers: [UserController],
})
export class UserModule {}
