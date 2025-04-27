import { Module } from '@nestjs/common';
import { FeeStructureService } from './fee-structure.service';
import { FeeStructureController } from './fee-structure.controller';

@Module({
  providers: [FeeStructureService],
  controllers: [FeeStructureController]
})
export class FeeStructureModule {}
