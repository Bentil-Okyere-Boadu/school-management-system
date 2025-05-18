import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class TeacherLocalAuthGuard extends AuthGuard('teacher-local') {} 