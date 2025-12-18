import { PartialType } from '@nestjs/mapped-types';
import { CreatePlannerEventDto } from './create-planner-event.dto';

export class UpdatePlannerEventDto extends PartialType(CreatePlannerEventDto) {}

