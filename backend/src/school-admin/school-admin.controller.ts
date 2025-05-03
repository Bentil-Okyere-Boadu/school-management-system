import { Controller, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { SanitizeResponseInterceptor } from '../common/interceptors/sanitize-response.interceptor';

@Controller('school-admin')
@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles('school_admin')
@UseInterceptors(SanitizeResponseInterceptor)
export class SchoolAdminController {
  constructor() {}
}
