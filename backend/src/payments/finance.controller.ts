import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { FinanceQueryDto } from './dto/finance-query.dto';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';

@ApiTags('Finance')
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.SchoolAdmin)
  @Get('my-school/students')
  @ApiOperation({
    summary:
      'Student finance ledger: total payable, paid, outstanding, arrears, prepayment, net balance',
  })
  listStudents(
    @CurrentUser() admin: SchoolAdmin,
    @Query() query: FinanceQueryDto,
  ) {
    return this.financeService.listStudents(admin.school.id, query);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.SchoolAdmin)
  @Get('my-school/classes')
  @ApiOperation({ summary: 'Class-level finance rollups' })
  listClasses(@CurrentUser() admin: SchoolAdmin) {
    return this.financeService.listClasses(admin.school.id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.SchoolAdmin)
  @Get('my-school/students/:studentId')
  @ApiOperation({
    summary:
      'Student finance detail: fee lines, totals, recent Hubtel payments',
  })
  getStudentDetail(
    @CurrentUser() admin: SchoolAdmin,
    @Param('studentId') studentId: string,
  ) {
    return this.financeService.getStudentDetail(admin.school.id, studentId);
  }
}
