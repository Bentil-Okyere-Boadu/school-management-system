import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Role } from '../role/role.entity';
import { School } from '../school/school.entity';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { EmailModule } from '../common/modules/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, School]), EmailModule],
  providers: [InvitationService],
  controllers: [InvitationController],
  exports: [InvitationService],
})
export class InvitationModule {}
