import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ParentAuthService } from './parent-auth.service';
import { ParentLocalAuthGuard } from './guards/parent-local-auth.guard';
import { ParentJwtAuthGuard } from './guards/parent-jwt-auth.guard';
import { Parent } from './parent.entity';
import { ForgotPasswordDto } from 'src/school-admin/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/school-admin/dto/reset-password.dto';
import { SkipTenantScope } from 'src/common/tenant/skip-tenant-scope.decorator';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SanitizeResponseInterceptor } from 'src/common/interceptors/sanitize-response.interceptor';
import { ParentDashboardService } from './parent-dashboard.service';
import { ParentPaymentService } from './parent-payment.service';
import { ParentLinkService } from './parent-link.service';
import { ConfirmChildDto } from './dto/confirm-child.dto';
import { ParentInitiatePaymentDto } from './dto/parent-payment.dto';
import { ParentLoginDto } from './dto/parent-login.dto';
import {
  ParentAcademicsQueryDto,
  ParentAttendanceQueryDto,
  ParentChildAttendanceQueryDto,
  ParentFinanceQueryDto,
  ParentOverviewQueryDto,
} from './dto/parent-query.dto';
import { VerifyAndPayPublicPaymentDto } from 'src/integrations/hubtel/dto/initiate-receive-money.dto';

@ApiTags('Parent')
@Controller('parent')
@UseInterceptors(SanitizeResponseInterceptor)
export class ParentController {
  constructor(
    private readonly parentAuthService: ParentAuthService,
    private readonly dashboardService: ParentDashboardService,
    private readonly paymentService: ParentPaymentService,
    private readonly parentLinkService: ParentLinkService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(ParentLocalAuthGuard)
  @Post('login')
  @SkipTenantScope()
  @ApiOperation({ summary: 'Parent login with email and password' })
  @ApiBody({ type: ParentLoginDto })
  login(
    @Request() req: { user: Parent },
    @Body() _credentials: ParentLoginDto,
  ) {
    return this.parentAuthService.login(req.user);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @SkipTenantScope()
  @ApiOperation({ summary: 'Request a parent password reset email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.parentAuthService.forgotPassword(dto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @SkipTenantScope()
  @ApiOperation({ summary: 'Reset parent password with email token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.parentAuthService.resetPassword(dto.token, dto.password);
  }

  @Post('relationships/confirm')
  @SkipTenantScope()
  @ApiOperation({
    summary: 'Confirm an extra child using the email confirmation token',
  })
  confirmChild(@Body() dto: ConfirmChildDto) {
    return this.parentLinkService.confirmChildByToken(dto.token);
  }

  @UseGuards(ParentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Parent)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current parent identity and active children' })
  getMe(@CurrentUser() parent: Parent) {
    return this.dashboardService.getMe(parent.id);
  }

  @UseGuards(ParentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Parent)
  @Get('calendars')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Academic calendars for the parent school' })
  getCalendars(@CurrentUser() parent: Parent) {
    return this.dashboardService.getCalendars(parent.id);
  }

  @UseGuards(ParentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Parent)
  @Get('overview')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Family overview for active linked children only',
  })
  getOverview(
    @CurrentUser() parent: Parent,
    @Query() query: ParentOverviewQueryDto,
  ) {
    return this.dashboardService.getOverview(parent.id, query);
  }

  @UseGuards(ParentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Parent)
  @Get('attendance')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Attendance KPIs and 1–31 day grid for active children (unmarked stays none)',
  })
  getAttendance(
    @CurrentUser() parent: Parent,
    @Query() query: ParentAttendanceQueryDto,
  ) {
    return this.dashboardService.getAttendance(parent.id, query);
  }

  @UseGuards(ParentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Parent)
  @Get('children/:studentId/attendance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Attendance grid for one active child' })
  getChildAttendance(
    @CurrentUser() parent: Parent,
    @Param('studentId') studentId: string,
    @Query() query: ParentChildAttendanceQueryDto,
  ) {
    const now = new Date();
    return this.dashboardService.getChildAttendanceReport(
      parent.id,
      studentId,
      query.month ?? now.getMonth() + 1,
      query.year ?? now.getFullYear(),
    );
  }

  @UseGuards(ParentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Parent)
  @Get('children/:studentId/attendance/report')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Attendance report for one active child' })
  getChildAttendanceReport(
    @CurrentUser() parent: Parent,
    @Param('studentId') studentId: string,
    @Query() query: ParentChildAttendanceQueryDto,
  ) {
    const now = new Date();
    return this.dashboardService.getChildAttendanceReport(
      parent.id,
      studentId,
      query.month ?? now.getMonth() + 1,
      query.year ?? now.getFullYear(),
    );
  }

  @UseGuards(ParentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Parent)
  @Get('finance')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Fee lines, outstanding balances, and payment history',
  })
  getFinance(
    @CurrentUser() parent: Parent,
    @Query() query: ParentFinanceQueryDto,
  ) {
    return this.dashboardService.getFinance(parent.id, query.studentId);
  }

  @UseGuards(ParentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Parent)
  @Get('children/:studentId/receipts/:transactionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Receipt for a paid transaction on an active child' })
  getReceipt(
    @CurrentUser() parent: Parent,
    @Param('studentId') studentId: string,
    @Param('transactionId') transactionId: string,
  ) {
    return this.dashboardService.getReceipt(
      parent.id,
      studentId,
      transactionId,
    );
  }

  @UseGuards(ParentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Parent)
  @Get('academics')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Published results, announcements, and required actions',
  })
  getAcademics(
    @CurrentUser() parent: Parent,
    @Query() query: ParentAcademicsQueryDto,
  ) {
    return this.dashboardService.getAcademics(
      parent.id,
      query.calendarId,
      query.studentId,
    );
  }

  @UseGuards(ParentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Parent)
  @Post('relationships/:id/confirm')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirm a pending child while logged in as the parent',
  })
  confirmOwnedChild(
    @CurrentUser() parent: Parent,
    @Param('id') linkId: string,
  ) {
    return this.parentLinkService.confirmChildAsParent(parent.id, linkId);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(ParentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Parent)
  @Post('payments/initiate')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Start a multi-child MoMo payment; each studentId must be an active linked child',
  })
  initiatePayment(
    @CurrentUser() parent: Parent,
    @Body() dto: ParentInitiatePaymentDto,
  ) {
    return this.paymentService.initiate(parent.id, dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(ParentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Parent)
  @Post('payments/verify-and-pay')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify checkout OTP and trigger Hubtel payment' })
  verifyPayment(
    @CurrentUser() parent: Parent,
    @Body() dto: VerifyAndPayPublicPaymentDto,
  ) {
    return this.paymentService.verifyAndPay(parent.id, dto);
  }

  @UseGuards(ParentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Parent)
  @Get('payments/status/:clientReference')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Payment status for a parent checkout reference' })
  paymentStatus(
    @CurrentUser() parent: Parent,
    @Param('clientReference') clientReference: string,
  ) {
    return this.paymentService.getStatus(parent.id, clientReference);
  }
}
