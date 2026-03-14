import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AdmissionStatus } from '../admission.entity';

export class UpdateAdmissionStatusDto {
  @ApiProperty({ enum: AdmissionStatus })
  @IsEnum(AdmissionStatus)
  status: AdmissionStatus;
}
