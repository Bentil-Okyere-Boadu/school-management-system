import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Role } from '../role/role.entity';
import { School } from '../school/school.entity';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { EmailModule } from '../common/modules/email.module';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { StudentModule } from 'src/student/student.module';
import { Student } from 'src/student/student.entity';
import { SchoolAdminService } from 'src/school-admin/school-admin.service';
import { Profile } from 'src/profile/profile.entity';
import { ProfileService } from 'src/profile/profile.service';
import { SchoolAdminAuthService } from 'src/school-admin/school-admin-auth.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      School,
      SchoolAdmin,
      Student,
      Profile,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    EmailModule,
    StudentModule,
  ],
  providers: [
    InvitationService,
    SchoolAdminService,
    ProfileService,
    SchoolAdminAuthService,
    AuthService,
  ],
  controllers: [InvitationController],
  exports: [InvitationService],
})
export class InvitationModule {}
