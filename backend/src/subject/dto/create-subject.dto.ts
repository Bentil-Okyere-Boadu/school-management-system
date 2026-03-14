import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({ description: 'Subject catalog UUID' })
  @IsNotEmpty()
  @IsUUID()
  subjectCatalogId: string;

  @ApiProperty({ type: [String], format: 'uuid', description: 'Class level UUIDs' })
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  classLevelIds: string[];

  @ApiProperty({ description: 'Teacher UUID' })
  @IsNotEmpty()
  @IsUUID()
  teacherId: string;
}
