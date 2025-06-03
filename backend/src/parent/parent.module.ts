import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parent } from './parent.entity';
import { Student } from '../student/student.entity';
import { ParentService } from './parent.service';
import { ParentController } from './parent.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Parent, Student])],
  providers: [ParentService],
  controllers: [ParentController],
})
export class ParentModule {}
