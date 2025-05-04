import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { SchoolModule } from './school/school.module';
import { CommonModule } from './common/common.module';
import { FeeStructureModule } from './fee-structure/fee-structure.module';
import { GradingSystemModule } from './grading-system/grading-system.module';
import { AdmissionPolicyModule } from './admission-policy/admission-policy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_URL,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity.{ts,js}'],
      synchronize: true,
      //logging: true,
    }),
    CommonModule,
    UserModule,
    RoleModule,
    PermissionModule,
    AuthModule,
    SchoolModule,
    FeeStructureModule,
    GradingSystemModule,
    AdmissionPolicyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
