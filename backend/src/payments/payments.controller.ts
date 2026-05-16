import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { RequestPaymentSetupDto } from './dto/request-payment-setup.dto';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { StudentJwtAuthGuard } from 'src/student/guards/student-jwt-auth.guard';
import { Student } from 'src/student/student.entity';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.SchoolAdmin)
  @Get('my-school')
  listSchoolPayments(
    @CurrentUser() admin: SchoolAdmin,
    @Query() query: PaymentQueryDto,
  ) {
    return this.paymentsService.listSchoolPayments(admin.school.id, query);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.SchoolAdmin)
  @Get('my-school/config')
  @ApiOperation({ summary: 'Hubtel payment readiness for your school' })
  getSchoolPaymentConfig(@CurrentUser() admin: SchoolAdmin) {
    return this.paymentsService.getPaymentConfigForSchool(admin.school.id);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.SchoolAdmin)
  @Post('my-school/request-setup')
  @ApiOperation({
    summary: 'Email platform team to request Hubtel / payments onboarding',
  })
  requestPaymentSetup(
    @CurrentUser() admin: SchoolAdmin,
    @Body() dto: RequestPaymentSetupDto,
  ) {
    return this.paymentsService.requestPaymentSetup(
      admin.school.id,
      admin,
      dto,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.SchoolAdmin)
  @Get('my-school/:transactionId/receipt')
  getSchoolReceipt(
    @CurrentUser() admin: SchoolAdmin,
    @Param('transactionId') transactionId: string,
  ) {
    return this.paymentsService.getReceiptByTransactionForSchoolAdmin(
      admin.school.id,
      transactionId,
    );
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Student)
  @Get('me')
  listMyPayments(
    @CurrentUser() student: Student,
    @Query() query: PaymentQueryDto,
  ) {
    return this.paymentsService.listStudentPayments(student.id, query);
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Student)
  @Get('me/config')
  @ApiOperation({ summary: 'Hubtel payment readiness for your school' })
  getMyPaymentConfig(@CurrentUser() student: Student) {
    return this.paymentsService.getPaymentConfigForSchool(student.school.id);
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Student)
  @Get('me/:transactionId/receipt')
  getMyReceipt(
    @CurrentUser() student: Student,
    @Param('transactionId') transactionId: string,
  ) {
    return this.paymentsService.getReceiptByTransactionForStudent(
      student.id,
      transactionId,
    );
  }
}
