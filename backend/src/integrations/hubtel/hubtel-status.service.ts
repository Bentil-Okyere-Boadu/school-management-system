import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HubtelStatusResponseDto } from './dto/hubtel-status-response.dto';

@Injectable()
export class HubtelStatusService {
  private readonly logger = new Logger(HubtelStatusService.name);
  private readonly baseUrl: string;
  private readonly posSalesId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('HUBTEL_TXN_STATUS_BASE_URL')?.trim() ??
      '';
    this.posSalesId = this.configService.get<string>('HUBTEL_POS_SALES_ID', '');
    this.clientId = this.configService.get<string>('HUBTEL_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>(
      'HUBTEL_CLIENT_SECRET',
      '',
    );
  }

  private buildAuthorizationHeader(): string | null {
    const id = this.clientId?.trim();
    const secret = this.clientSecret?.trim();
    if (!id || !secret) {
      return null;
    }
    const credentials = Buffer.from(`${id}:${secret}`, 'utf8').toString(
      'base64',
    );
    return `Basic ${credentials}`;
  }

  async checkTransactionStatus(
    clientReference: string,
  ): Promise<HubtelStatusResponseDto | null> {
    const authHeader = this.buildAuthorizationHeader();

    if (!this.baseUrl) {
      this.logger.warn(
        'HUBTEL_TXN_STATUS_BASE_URL not configured; skipping Hubtel status check',
      );
      return null;
    }

    if (!this.posSalesId || !authHeader) {
      this.logger.warn(
        'HUBTEL_POS_SALES_ID, HUBTEL_CLIENT_ID, or HUBTEL_CLIENT_SECRET not configured; skipping Hubtel status check',
      );
      return null;
    }

    const url = `${this.baseUrl.replace(/\/$/, '')}/transactions/${this.posSalesId}/status?clientReference=${encodeURIComponent(clientReference)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Hubtel status check failed (${response.status}) for ${clientReference}`,
      );
    }

    const json = (await response.json()) as HubtelStatusResponseDto;
    return json;
  }
}
