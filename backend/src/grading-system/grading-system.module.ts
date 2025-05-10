import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradingSystemController } from './grading-system.controller';
import { GradingSystemService } from './grading-system.service';
import { GradingSystem } from './grading-system.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GradingSystem])],
  controllers: [GradingSystemController],
  providers: [GradingSystemService],
  exports: [GradingSystemService],
})
export class GradingSystemModule {}
