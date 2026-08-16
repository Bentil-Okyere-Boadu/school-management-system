import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ParentLocalAuthGuard extends AuthGuard('parent-local') {}
