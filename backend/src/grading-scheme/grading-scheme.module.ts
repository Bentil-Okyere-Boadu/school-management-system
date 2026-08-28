import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradingScheme } from './grading-scheme.entity';
import { GradingSchemeBand } from './grading-scheme-band.entity';
import { GradingSchemeService } from './grading-scheme.service';
import { GradingSchemeController } from './grading-scheme.controller';
import { ClassLevel } from '../class-level/class-level.entity';
import { GradingSystem } from '../grading-system/grading-system.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GradingScheme,
      GradingSchemeBand,
      ClassLevel,
      GradingSystem,
    ]),
  ],
  controllers: [GradingSchemeController],
  providers: [GradingSchemeService],
  exports: [GradingSchemeService],
})
export class GradingSchemeModule {}
