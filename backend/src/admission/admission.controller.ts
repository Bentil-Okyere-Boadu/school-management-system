import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { AdmissionService } from './admission.service';
import { ObjectStorageServiceService } from '../object-storage-service/object-storage-service.service';

@Controller('admissions')
export class AdmissionController {
  constructor(
    private readonly admissionService: AdmissionService,
    private readonly objectStorageService: ObjectStorageServiceService,
  ) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async createAdmission(
    @Body() createAdmissionDto: CreateAdmissionDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    // File handling logic: match files to DTO fields by fieldname
    // (e.g., studentHeadshot, studentBirthCert, guardianHeadshot_0, previousSchoolResult)
    // Upload files to object storage and set path/mediaType in DTO
    // (Implementation details can be filled in as needed)
    return this.admissionService.createAdmission(createAdmissionDto, files);
  }
}
