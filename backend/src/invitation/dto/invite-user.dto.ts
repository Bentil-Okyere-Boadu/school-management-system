import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class InviteUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'user@school.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Role UUID' })
  @IsNotEmpty()
  @IsUUID()
  roleId?: string;

  @ApiProperty({ description: 'Catalog school id to invite into' })
  @IsNotEmpty()
  @IsUUID()
  schoolId: string;
}
