import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AdminResultActionDto {
  @ApiProperty()
  @IsUUID('4')
  classLevelId: string;

  @ApiProperty()
  @IsUUID('4')
  academicTermId: string;
}

export class AdminReturnResultsDto extends AdminResultActionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  returnNote: string;
}

export class AdminResultsReviewQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  classLevelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  teacherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  academicTermId?: string;
}
