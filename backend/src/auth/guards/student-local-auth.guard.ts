import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
 
@Injectable()
export class StudentLocalAuthGuard extends AuthGuard('student-local') {} 