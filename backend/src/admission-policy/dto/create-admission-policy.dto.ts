import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAdmissionPolicyDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
