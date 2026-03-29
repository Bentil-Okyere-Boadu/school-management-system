import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PreviousSchoolResult } from '../previous-school-result.entity';

class GuardianDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relationship?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dob?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  streetAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  boxAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guardianOtherPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guardianOtherPhoneOptional?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  headshotPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  headshotMediaType?: string;
}

export class CreateAdmissionDto {
  @ApiProperty({ description: 'School UUID' })
  @IsString()
  schoolId: string;

  @ApiProperty()
  @IsString()
  studentFirstName: string;

  @ApiProperty()
  @IsString()
  studentLastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentOtherNames?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentDOB?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentPlaceOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentGender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentNationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentReligion?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studentLanguages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentStreetAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentBoxAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentOtherPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentOtherPhoneOptional?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentHeadshotPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentHeadshotMediaType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentBirthCertPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentBirthCertMediaType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  forClassId?: string;

  @ApiProperty({ type: [GuardianDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardianDto)
  guardians: GuardianDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  homePrimaryLanguage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  homeOtherLanguage?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasPreviousSchool?: boolean = false;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousSchoolName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousSchoolUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousSchoolStreetAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousSchoolCity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  previousSchoolResults?: PreviousSchoolResult[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousSchoolState?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousSchoolCountry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousSchoolBoxAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousSchoolPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousSchoolAttendedFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousSchoolAttendedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousSchoolGradeClass?: string;
}
