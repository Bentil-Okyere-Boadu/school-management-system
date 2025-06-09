import { IsOptional, IsString, IsArray } from 'class-validator';

export class CreateAdmissionStudentInfoDto {
  @IsString()
  schoolId: string;

  @IsOptional()
  @IsString()
  studentFirstName?: string;

  @IsOptional()
  @IsString()
  studentLastName?: string;

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
  studentHeadshotPath?: string;

  @IsOptional()
  @IsString()
  studentHeadshotMediaType?: string;

  @IsOptional()
  @IsString()
  studentBirthCertPath?: string;

  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  @IsString()
  forClassId?: string;
}
