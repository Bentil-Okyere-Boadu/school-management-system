import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender } from 'src/student/student.entity';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  otherName?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  PlaceOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    return value;
  })
  @IsEnum(Gender, {
    message: 'Gender must be either "male" or "female"',
  })
  gender?: Gender | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  DateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  BoxAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  streetAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  optionalPhoneContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  optionalPhoneContactTwo?: string;
}
