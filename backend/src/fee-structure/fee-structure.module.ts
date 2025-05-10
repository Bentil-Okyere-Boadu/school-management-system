import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeStructureController } from './fee-structure.controller';
import { FeeStructureService } from './fee-structure.service';
import { FeeStructure } from './fee-structure.entity';
import { ClassLevel } from '../class-level/class-level.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeeStructure, ClassLevel])],
  controllers: [FeeStructureController],
  providers: [FeeStructureService],
  exports: [FeeStructureService],
})
export class FeeStructureModule {}
