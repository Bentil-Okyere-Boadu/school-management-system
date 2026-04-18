import { All, Controller, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ExternalApiProxyService } from './external-api-proxy.service';

@Controller('proxy')
export class ExternalApiProxyController {
  constructor(private readonly proxyService: ExternalApiProxyService) {}

  @All('*')
  async proxy(@Req() req: Request) {
    return this.proxyService.forwardRequest(req);
  }
}
