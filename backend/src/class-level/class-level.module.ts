import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassLevel } from './class-level.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassLevel])],
  exports: [TypeOrmModule],
})
export class ClassLevelModule {}
