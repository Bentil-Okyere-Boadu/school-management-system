import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmChildDto {
  @ApiProperty({
    description: 'Confirmation token from the confirm-child email',
  })
  @IsString()
  token: string;
}
