import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { isAxiosError } from 'axios';

const PROXY_PATH_PREFIX = '/api/v1/proxy';

@Injectable()
export class ExternalApiProxyService {
  private readonly logger = new Logger(ExternalApiProxyService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async forwardRequest(req: Request): Promise<unknown> {
    const baseUrl = this.configService
      .get<string>('PROXY_URL', '')
      ?.trim()
      .replace(/\/$/, '');

    if (!baseUrl) {
      throw new ServiceUnavailableException(
        'PROXY_URL is not configured (set it to your Lightsail forwarder base URL, e.g. http://100.28.152.198:5000)',
      );
    }

    const targetUrl = this.buildTargetUrl(req, baseUrl);

    const method = req.method.toLowerCase();
    const headers: Record<string, string> = {};
    for (const name of [
      'authorization',
      'content-type',
      'accept',
      'x-requested-with',
    ]) {
      const v = req.headers[name];
      if (typeof v === 'string') {
        headers[name] = v;
      }
    }

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          url: targetUrl,
          method,
          headers,
          data: ['get', 'head'].includes(method) ? undefined : req.body,
          validateStatus: () => true,
        }),
      );

      const { status, data } = response;

      if (status >= 400) {
        this.logger.warn(
          `Upstream ${method.toUpperCase()} ${targetUrl} returned ${status}`,
        );
        throw new HttpException(
          typeof data === 'object' && data !== null
            ? data
            : { message: String(data) },
          status,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (isAxiosError(error)) {
        const status = error.response?.status ?? HttpStatus.BAD_GATEWAY;
        const payload = error.response?.data ?? {
          message: error.message || 'Upstream request failed',
        };
        this.logger.error(
          `Proxy error for ${targetUrl}: ${error.message}`,
          error.stack,
        );
        throw new HttpException(payload, status);
      }
      throw error;
    }
  }

  private buildTargetUrl(req: Request, baseUrl: string): string {
    const original = req.originalUrl || req.url || '';
    const pathOnly = original.split('?')[0];
    const idx = pathOnly.indexOf(PROXY_PATH_PREFIX);
    if (idx === -1) {
      throw new HttpException('Invalid proxy path', HttpStatus.BAD_REQUEST);
    }
    let rest = pathOnly.slice(idx + PROXY_PATH_PREFIX.length);
    if (!rest.startsWith('/')) {
      rest = `/${rest}`;
    }
    const query = original.includes('?')
      ? original.slice(original.indexOf('?'))
      : '';
    return `${baseUrl}/api/v1${rest}${query}`;
  }
}
