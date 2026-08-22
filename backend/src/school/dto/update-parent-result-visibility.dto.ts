import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateParentResultVisibilityDto {
  @ApiProperty()
  @IsBoolean()
  parentShowScores: boolean;

  @ApiProperty()
  @IsBoolean()
  parentShowGrades: boolean;

  @ApiProperty()
  @IsBoolean()
  parentShowLabels: boolean;

  @ApiProperty()
  @IsBoolean()
  parentShowFeedback: boolean;
}
