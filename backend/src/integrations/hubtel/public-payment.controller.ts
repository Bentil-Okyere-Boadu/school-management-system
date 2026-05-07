import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  StudentInitiatePaymentDto,
  VerifyAndPayPublicPaymentDto,
} from './dto/initiate-receive-money.dto';
import { PublicPaymentService } from './public-payment.service';
import { StudentJwtAuthGuard } from 'src/student/guards/student-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Student } from 'src/student/student.entity';

@ApiTags('Student payments (OTP checkout)')
@ApiBearerAuth()
@UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles(Role.Student)
@Controller('payments/public')
export class PublicPaymentController {
  constructor(private readonly publicPaymentService: PublicPaymentService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('initiate')
  @ApiOperation({
    summary: 'Send payment OTP via SMS (logged-in student only)',
  })
  initiate(
    @Body() dto: StudentInitiatePaymentDto,
    @CurrentUser() student: Student,
  ) {
    return this.publicPaymentService.initiate(dto, student.id);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('verify-and-pay')
  @ApiOperation({
    summary: 'Verify OTP and trigger Hubtel Direct Receive for your school',
  })
  verifyAndPay(
    @Body() dto: VerifyAndPayPublicPaymentDto,
    @CurrentUser() student: Student,
  ) {
    return this.publicPaymentService.verifyAndPay(dto, student.id);
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get('status/:clientReference')
  @ApiOperation({
    summary: 'Payment status for your transaction only',
  })
  status(
    @Param('clientReference') clientReference: string,
    @CurrentUser() student: Student,
  ) {
    return this.publicPaymentService.getStatus(clientReference, student.id);
  }
}
