import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlannerService } from './planner.service';
import { PlannerController } from './planner.controller';
import { PlannerEvent } from './entities/planner-event.entity';
import { EventCategory } from './entities/event-category.entity';
import { ClassLevel } from '../class-level/class-level.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlannerEvent, EventCategory, ClassLevel]),
  ],
  controllers: [PlannerController],
  providers: [PlannerService],
  exports: [PlannerService],
})
export class PlannerModule {}

