import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

class GuardianDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  relationship?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  streetAddress?: string;

  @IsOptional()
  @IsString()
  boxAddress?: string;

  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @IsOptional()
  @IsString()
  guardianOtherPhone?: string;

  @IsOptional()
  @IsString()
  guardianOtherPhoneOptional?: string;

  @IsOptional()
  @IsString()
  headshotPath?: string;

  @IsOptional()
  @IsString()
  headshotMediaType?: string;
}

export class CreateAdmissionDto {
  @IsString()
  schoolId: string;

  // Student Info
  @IsString()
  studentFirstName: string;

  @IsString()
  studentLastName: string;

  @IsOptional()
  @IsString()
  studentOtherNames?: string;

  @IsOptional()
  @IsString()
  studentEmail?: string;

  @IsOptional()
  @IsString()
  studentDOB?: string;

  @IsOptional()
  @IsString()
  studentGender?: string;

  @IsOptional()
  @IsString()
  studentNationality?: string;

  @IsOptional()
  @IsString()
  studentReligion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studentLanguages?: string[];

  @IsOptional()
  @IsString()
  studentStreetAddress?: string;

  @IsOptional()
  @IsString()
  studentBoxAddress?: string;

  @IsOptional()
  @IsString()
  studentPhone?: string;

  @IsOptional()
  @IsString()
  studentOtherPhone?: string;

  @IsOptional()
  @IsString()
  studentOtherPhoneOptional?: string;

  @IsOptional()
  @IsString()
  studentHeadshotPath?: string;

  @IsOptional()
  @IsString()
  studentHeadshotMediaType?: string;

  @IsOptional()
  @IsString()
  studentBirthCertPath?: string;

  @IsOptional()
  @IsString()
  studentBirthCertMediaType?: string;

  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  @IsString()
  forClassId?: string;

  // Guardians
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardianDto)
  guardians: GuardianDto[];

  // Additional Info
  @IsOptional()
  @IsString()
  homePrimaryLanguage?: string;

  @IsOptional()
  @IsString()
  homeOtherLanguage?: string;

  @IsOptional()
  @IsBoolean()
  hasPreviousSchool?: boolean = false;

  @IsOptional()
  @IsString()
  previousSchoolName?: string;

  @IsOptional()
  @IsString()
  previousSchoolUrl?: string;

  @IsOptional()
  @IsString()
  previousSchoolStreetAddress?: string;

  @IsOptional()
  @IsString()
  previousSchoolCity?: string;

  @IsOptional()
  @IsString()
  previousSchoolState?: string;

  @IsOptional()
  @IsString()
  previousSchoolCountry?: string;

  @IsOptional()
  @IsString()
  previousSchoolBoxAddress?: string;

  @IsOptional()
  @IsString()
  previousSchoolPhone?: string;

  @IsOptional()
  @IsString()
  previousSchoolAttendedFrom?: string;

  @IsOptional()
  @IsString()
  previousSchoolAttendedTo?: string;

  @IsOptional()
  @IsString()
  previousSchoolGradeClass?: string;

  @IsOptional()
  @IsString()
  previousSchoolResultPath?: string;

  @IsOptional()
  @IsString()
  previousSchoolResultMediaType?: string;
}
