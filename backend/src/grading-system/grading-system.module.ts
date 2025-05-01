import { Module } from '@nestjs/common';
import { GradingSystemService } from './grading-system.service';
import { GradingSystemController } from './grading-system.controller';

@Module({
  providers: [GradingSystemService],
  controllers: [GradingSystemController],
})
export class GradingSystemModule {}
