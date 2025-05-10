import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SchoolAdminLocalAuthGuard extends AuthGuard('school-admin-local') {
} 