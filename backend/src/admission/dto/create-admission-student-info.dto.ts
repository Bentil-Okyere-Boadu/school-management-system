import { IsEnum } from 'class-validator';
import { AdmissionStatus } from '../admission.entity';

export class UpdateAdmissionStatusDto {
  @IsEnum(AdmissionStatus)
  status: AdmissionStatus;
}
