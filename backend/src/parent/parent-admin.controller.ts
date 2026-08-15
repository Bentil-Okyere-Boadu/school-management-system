import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { SchoolAdminSchoolGuard } from 'src/school-admin/guards/school-admin-school.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { ParentLinkService } from './parent-link.service';
import { ParentAuthorizationService } from './parent.authorization';
import { SanitizeResponseInterceptor } from 'src/common/interceptors/sanitize-response.interceptor';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parent } from './parent.entity';

@ApiTags('School Admin')
@ApiBearerAuth()
@Controller('school-admin/parents')
@UseInterceptors(SanitizeResponseInterceptor)
@UseGuards(
  SchoolAdminJwtAuthGuard,
  ActiveUserGuard,
  RolesGuard,
  SchoolAdminSchoolGuard,
)
@Roles(Role.SchoolAdmin)
export class ParentAdminController {
  constructor(
    private readonly parentLinkService: ParentLinkService,
    private readonly authorization: ParentAuthorizationService,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List parent–student relationships for the school',
  })
  list(@CurrentUser() admin: SchoolAdmin) {
    return this.parentLinkService.listSchoolRelationships(admin.school.id);
  }

  @Post(':parentId/resend-invitation')
  @ApiOperation({ summary: 'Resend the set-password invitation to a parent' })
  async resendInvitation(
    @CurrentUser() admin: SchoolAdmin,
    @Param('parentId') parentId: string,
  ) {
    const parent = await this.parentRepository.findOne({
      where: { id: parentId, school: { id: admin.school.id } },
      relations: ['school', 'role'],
    });
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }
    return this.parentLinkService.resendInvitation(parent);
  }

  @Post('relationships/:id/resend-confirmation')
  @ApiOperation({
    summary: 'Resend the confirm-child email for a pending relationship',
  })
  async resendConfirmation(
    @CurrentUser() admin: SchoolAdmin,
    @Param('id') id: string,
  ) {
    const link = await this.authorization.requireLinkInSchool(
      id,
      admin.school.id,
    );
    return this.parentLinkService.resendChildConfirmation(link);
  }

  @Post('relationships/:id/activate')
  @ApiOperation({
    summary: 'Activate a parent–student relationship after review',
  })
  async activate(
    @CurrentUser() admin: SchoolAdmin,
    @Param('id') id: string,
  ) {
    const link = await this.authorization.requireLinkInSchool(
      id,
      admin.school.id,
    );
    return this.parentLinkService.adminActivate(link);
  }

  @Post('relationships/:id/send-to-confirmation')
  @ApiOperation({
    summary: 'Move a reviewed relationship to pending confirmation',
  })
  async sendToConfirmation(
    @CurrentUser() admin: SchoolAdmin,
    @Param('id') id: string,
  ) {
    const link = await this.authorization.requireLinkInSchool(
      id,
      admin.school.id,
    );
    return this.parentLinkService.adminSendToConfirmation(link);
  }

  @Post('relationships/:id/revoke')
  @ApiOperation({ summary: 'Revoke parent portal access to a student' })
  async revoke(
    @CurrentUser() admin: SchoolAdmin,
    @Param('id') id: string,
  ) {
    const link = await this.authorization.requireLinkInSchool(
      id,
      admin.school.id,
    );
    return this.parentLinkService.adminRevoke(link);
  }
}
