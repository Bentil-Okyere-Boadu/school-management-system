import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from './school.entity';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { User } from 'src/user/user.entity';
import { InvitationModule } from 'src/invitation/invitation.module';

@Module({
  imports: [TypeOrmModule.forFeature([School, User]), InvitationModule],
  providers: [SchoolService],
  controllers: [SchoolController],
  exports: [SchoolService],
})
export class SchoolModule {}
