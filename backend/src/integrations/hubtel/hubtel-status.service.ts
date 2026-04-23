import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HubtelStatusResponseDto } from './dto/hubtel-status-response.dto';

export type HubtelStatusLookup = {
  sessionId: string;
  hubtelTransactionId?: string | null;
  networkTransactionId?: string | null;
};

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

  /**
   * Resolves payment status via Hubtel, trying lookup keys in order:
   * 1. HubtelTransactionId (ledger id from fulfilment)
   * 2. NetworkTransactionId (from fulfilment ExternalTransactionId)
   * 3. clientReference (USSD SessionId — least reliable alone)
   */
  async checkTransactionStatus(
    lookup: HubtelStatusLookup,
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

    const attempts: { label: string; query: string }[] = [];
    const hid = lookup.hubtelTransactionId?.trim();
    const nid = lookup.networkTransactionId?.trim();

    if (hid) {
      attempts.push({
        label: 'HubtelTransactionId',
        query: `HubtelTransactionId=${encodeURIComponent(hid)}`,
      });
    }
    if (nid) {
      attempts.push({
        label: 'NetworkTransactionId',
        query: `NetworkTransactionId=${encodeURIComponent(nid)}`,
      });
    }
    const sid = lookup.sessionId;
    attempts.push({
      label: 'clientReference',
      query: `clientReference=${encodeURIComponent(sid)}`,
    });
    attempts.push({
      label: 'ClientReference',
      query: `ClientReference=${encodeURIComponent(sid)}`,
    });

    const base = `${this.baseUrl.replace(/\/$/, '')}/transactions/${this.posSalesId}/status`;

    for (const attempt of attempts) {
      const url = `${base}?${attempt.query}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
      });

      const text = await response.text();
      let json: HubtelStatusResponseDto | null = null;
      try {
        json = JSON.parse(text) as HubtelStatusResponseDto;
      } catch {
        this.logger.warn(
          `Hubtel status non-JSON response (${response.status}) for ${attempt.label}`,
        );
        if (!response.ok && response.status >= 500) {
          throw new Error(
            `Hubtel status upstream ${response.status} for ${attempt.label}`,
          );
        }
        continue;
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `Hubtel status auth failed (${response.status}). Check HUBTEL_CLIENT_ID / HUBTEL_CLIENT_SECRET.`,
        );
      }

      if (response.status >= 500 || (!response.ok && response.status !== 404)) {
        throw new Error(
          `Hubtel status request failed (${response.status}) for ${attempt.label}`,
        );
      }

      if (this.isSuccessfulHubtelStatus(json)) {
        this.logger.log(
          `Hubtel status API: success via ${attempt.label} sessionId=${lookup.sessionId}`,
        );
        return json;
      }

      this.logger.debug(
        `Hubtel status attempt ${attempt.label}: ${json.message} (responseCode=${String(json.responseCode)})`,
      );
    }

    return null;
  }

  private isSuccessfulHubtelStatus(
    json: HubtelStatusResponseDto | null,
  ): boolean {
    if (!json || json.data == null) {
      return false;
    }
    const code = String(json.responseCode ?? '');
    return code === '200';
  }
}
