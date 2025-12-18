import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateEventCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

