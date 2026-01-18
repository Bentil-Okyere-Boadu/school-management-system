import { PartialType } from '@nestjs/mapped-types';
import { CreateGradingSystemDto } from './create-grading-system.dto';

export class UpdateGradingSystemDto extends PartialType(CreateGradingSystemDto) {} 