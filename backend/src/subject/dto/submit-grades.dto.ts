import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitGradeEntryDto {
  @ApiProperty()
  @IsUUID('4')
  studentId: string;

  @ApiPropertyOptional({ description: 'Omit or null when score not entered yet' })
  @IsOptional()
  @IsNumber()
  classScore?: number | null;

  @ApiPropertyOptional({ description: 'Omit or null when score not entered yet' })
  @IsOptional()
  @IsNumber()
  examScore?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string | null;

  @ApiPropertyOptional({ description: 'Manual grade override when enabled by school' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  overrideGrade?: string | null;

  @ApiPropertyOptional({ description: 'Required when overrideGrade is set' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  overrideReason?: string | null;
}

export class SubmitGradesDto {
  @ApiProperty()
  @IsUUID('4')
  classLevelId: string;

  @ApiProperty()
  @IsUUID('4')
  subjectId: string;

  @ApiProperty()
  @IsUUID('4')
  academicTermId: string;

  @ApiProperty({ enum: ['draft', 'submit'] })
  @IsIn(['draft', 'submit'])
  saveMode: 'draft' | 'submit';

  @ApiPropertyOptional({
    description: 'When true, submit even if some students have missing scores',
  })
  @IsOptional()
  @IsBoolean()
  forceSubmit?: boolean;

  @ApiProperty({ type: [SubmitGradeEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitGradeEntryDto)
  grades: SubmitGradeEntryDto[];
}
