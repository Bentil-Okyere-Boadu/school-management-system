import { IsOptional, IsString, IsEmail, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message:
      'Phone number must be between 7 and 15 digits and can start with a +',
  })
  phoneContact?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  streetAddress?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message:
      'Optional phone number must be between 7 and 15 digits and can start with a +',
  })
  optionalPhoneContact?: string;
}
