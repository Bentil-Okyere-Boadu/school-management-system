import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class InvitationException extends BaseException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message, status);
  }
}
