import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsUUID, IsDateString } from 'class-validator';

export class CreateFeeStructureDto {
  @IsNotEmpty()
  @IsString()
  feeType: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(['all', 'new', 'continuing'], { 
    message: 'appliesTo must be one of the following values: all, new, continuing' 
  })
  appliesTo?: 'all' | 'new' | 'continuing' = 'all';

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  classLevelId?: string;
} 