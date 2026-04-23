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

<<<<<<< Updated upstream
=======
  /**
   * Query params per Hubtel docs (camelCase): hubtelTransactionId, networkTransactionId, clientReference.
   * Success response uses responseCode "0000" (and sometimes "200").
   */
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
    const url = `${this.baseUrl.replace(/\/$/, '')}/transactions/${this.posSalesId}/status?clientReference=${encodeURIComponent(clientReference)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
=======
    const attempts: { label: string; query: string }[] = [];
    const hid = lookup.hubtelTransactionId?.trim();
    const nid = lookup.networkTransactionId?.trim();

    if (hid) {
      attempts.push({
        label: 'hubtelTransactionId',
        query: `hubtelTransactionId=${encodeURIComponent(hid)}`,
      });
    }
    if (nid) {
      attempts.push({
        label: 'networkTransactionId',
        query: `networkTransactionId=${encodeURIComponent(nid)}`,
      });
    }
    attempts.push({
      label: 'clientReference',
      query: `clientReference=${encodeURIComponent(lookup.sessionId)}`,
>>>>>>> Stashed changes
    });

    if (!response.ok) {
      throw new Error(
        `Hubtel status check failed (${response.status}) for ${clientReference}`,
      );
    }

<<<<<<< Updated upstream
    const json = (await response.json()) as HubtelStatusResponseDto;
    return json;
=======
    return null;
  }

  private isSuccessfulHubtelStatus(
    json: HubtelStatusResponseDto | null,
  ): boolean {
    if (!json || json.data == null) {
      return false;
    }
    const code = String(json.responseCode ?? '');
    return code === '0000' || code === '200';
>>>>>>> Stashed changes
  }
}
