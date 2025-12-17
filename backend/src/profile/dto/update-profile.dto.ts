import { IsOptional, IsString, IsEmail, Matches, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender } from 'src/student/student.entity';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  otherName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneContact?: string;

  @IsOptional()
  @IsString()
  PlaceOfBirth?: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Convert empty string to null/undefined
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    return value;
  })
  @IsEnum(Gender, {
    message: 'Gender must be either "male" or "female"',
  })
  gender?: Gender | null;

  @IsOptional()
  @IsString()
  DateOfBirth?: string;

  @IsOptional()
  @IsString()
  BoxAddress?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  streetAddress?: string;

  @IsOptional()
  @IsString()
  optionalPhoneContact?: string;

  @IsOptional()
  @IsString()
  optionalPhoneContactTwo?: string;
}
