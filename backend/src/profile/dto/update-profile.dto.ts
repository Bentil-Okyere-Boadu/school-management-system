import { IsOptional, IsString, IsEmail, Matches } from 'class-validator';

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
