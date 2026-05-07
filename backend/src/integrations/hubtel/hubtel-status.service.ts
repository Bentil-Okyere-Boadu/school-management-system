import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { School } from 'src/school/school.entity';
import { HubtelStatusResponseDto } from './dto/hubtel-status-response.dto';
import {
  HubtelCredentialsService,
  ResolvedHubtelMerchant,
} from './hubtel-credentials.service';

export type HubtelStatusLookup = {
  sessionId: string;
  hubtelTransactionId?: string | null;
  networkTransactionId?: string | null;
};

const DEFAULT_TXN_STATUS_BASE_URL = 'https://api-txnstatus.hubtel.com';

/**
 * Calls Hubtel's Transaction Status API for a given school using that
 * school's per-tenant credentials and Collection Account Number. Used by the
 * reconciliation scheduler when a final callback has not arrived within the
 * SLA (5+ minutes).
 */
@Injectable()
export class HubtelStatusService {
  private readonly logger = new Logger(HubtelStatusService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly credentialsService: HubtelCredentialsService,
  ) {
    this.baseUrl = (
      this.configService.get<string>('HUBTEL_TXN_STATUS_BASE_URL') ??
      DEFAULT_TXN_STATUS_BASE_URL
    )
      .trim()
      .replace(/\/$/, '');
  }

  /**
   * Resolves payment status via Hubtel for a specific school, trying lookup
   * keys in order:
   *   1. HubtelTransactionId (ledger id from fulfilment)
   *   2. NetworkTransactionId (from fulfilment ExternalTransactionId)
   *   3. ClientReference (sessionId)
   */
  async checkTransactionStatus(
    school: School,
    lookup: HubtelStatusLookup,
  ): Promise<HubtelStatusResponseDto | null> {
    if (!this.baseUrl) {
      this.logger.warn(
        'HUBTEL_TXN_STATUS_BASE_URL not configured; skipping Hubtel status check',
      );
      return null;
    }

    let credentials: ResolvedHubtelMerchant;
    try {
      credentials = this.credentialsService.fromSchool(school);
    } catch (err) {
      this.logger.warn(
        `Skipping Hubtel status check for school ${school.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return null;
    }

    const attempts: { label: string; query: string }[] = [];
    const hid = lookup.hubtelTransactionId?.trim();
    const nid = lookup.networkTransactionId?.trim();
    const sid = lookup.sessionId;

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
    attempts.push({
      label: 'clientReference',
      query: `clientReference=${encodeURIComponent(sid)}`,
    });
    attempts.push({
      label: 'ClientReference',
      query: `ClientReference=${encodeURIComponent(sid)}`,
    });

    const base = `${this.baseUrl}/transactions/${encodeURIComponent(
      credentials.collectionAccountNumber,
    )}/status`;

    for (const attempt of attempts) {
      const url = `${base}?${attempt.query}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: credentials.basicAuthHeader,
          Accept: 'application/json',
        },
      });

      const text = await response.text();
      let json: HubtelStatusResponseDto | null = null;
      try {
        json = JSON.parse(text) as HubtelStatusResponseDto;
      } catch {
        this.logger.warn(
          `Hubtel status non-JSON response (${response.status}) for ${attempt.label} schoolId=${school.id}`,
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
          `Hubtel status auth failed (${response.status}) for school ${school.id}. Check Hubtel merchant credentials.`,
        );
      }

      if (response.status >= 500 || (!response.ok && response.status !== 404)) {
        throw new Error(
          `Hubtel status request failed (${response.status}) for ${attempt.label} schoolId=${school.id}`,
        );
      }

      if (this.isSuccessfulHubtelStatus(json)) {
        this.logger.log(
          `Hubtel status API: success via ${attempt.label} schoolId=${school.id} sessionId=${lookup.sessionId}`,
        );
        return json;
      }

      this.logger.debug(
        `Hubtel status attempt ${attempt.label} schoolId=${school.id}: ${json.message} (responseCode=${String(json.responseCode)})`,
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
    // The Status Check API returns 0000 (string) on Successful per the docs;
    // some deployments echo HTTP "200" — accept both.
    return code === '0000' || code === '200';
  }
}
