import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { School } from 'src/school/school.entity';
import { HubtelCredentialsService } from './hubtel-credentials.service';
import {
  HubtelDirectReceiveMoneyRequest,
  HubtelDirectReceiveMoneyResponse,
  HubtelMobileMoneyChannel,
} from './dto/initiate-receive-money.dto';
import { HubtelOutcome, mapHubtelResponseCode } from './hubtel-response-codes';
import { buildReceiveMoneyPrimaryCallbackUrl } from './hubtel-callback-url.util';

const DEFAULT_BASE_URL = 'https://rmp.hubtel.com';

export interface InitiateReceiveMoneyParams {
  school: School;
  clientReference: string;
  amount: number;
  customerMsisdn: string;
  channel: HubtelMobileMoneyChannel;
  description: string;
  customerName?: string;
  customerEmail?: string;
}

export interface InitiateReceiveMoneyResult {
  outcome: HubtelOutcome;
  rawResponse: HubtelDirectReceiveMoneyResponse;
  hubtelTransactionId: string | null;
  httpStatus: number;
  primaryCallbackUrl: string;
}

@Injectable()
export class HubtelDirectReceiveService {
  private readonly logger = new Logger(HubtelDirectReceiveService.name);
  private readonly baseUrl: string;
  private readonly callbackBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly credentialsService: HubtelCredentialsService,
  ) {
    this.baseUrl = (
      this.configService.get<string>('HUBTEL_DIRECT_RECEIVE_BASE_URL') ??
      DEFAULT_BASE_URL
    )
      .trim()
      .replace(/\/$/, '');
    this.callbackBaseUrl = (
      this.configService.get<string>('HUBTEL_PRIMARY_CALLBACK_BASE_URL') ?? ''
    )
      .trim()
      .replace(/\/$/, '');
  }

  buildPrimaryCallbackUrl(schoolId: string): string {
    const url = buildReceiveMoneyPrimaryCallbackUrl(
      this.callbackBaseUrl,
      schoolId,
    );
    if (!url) {
      throw new Error(
        'HUBTEL_PRIMARY_CALLBACK_BASE_URL is not configured; cannot build PrimaryCallbackUrl',
      );
    }
    return url;
  }

  getPrimaryCallbackUrlOrNull(schoolId: string): string | null {
    return buildReceiveMoneyPrimaryCallbackUrl(this.callbackBaseUrl, schoolId);
  }

  async initiate(
    params: InitiateReceiveMoneyParams,
  ): Promise<InitiateReceiveMoneyResult> {
    const credentials = this.credentialsService.fromSchool(params.school);
    const primaryCallbackUrl = this.buildPrimaryCallbackUrl(params.school.id);

    const url = `${this.baseUrl}/merchantaccount/merchants/${encodeURIComponent(
      credentials.collectionAccountNumber,
    )}/receive/mobilemoney`;

    const body: HubtelDirectReceiveMoneyRequest = {
      CustomerName: params.customerName,
      CustomerMsisdn: params.customerMsisdn,
      CustomerEmail: params.customerEmail,
      Channel: params.channel,
      Amount: Math.round(params.amount * 100) / 100,
      PrimaryCallbackUrl: primaryCallbackUrl,
      Description: params.description,
      ClientReference: params.clientReference,
    };

    this.logger.log(
      `Hubtel Direct Receive: initiating schoolId=${params.school.id} clientReference=${params.clientReference} amount=${body.Amount} channel=${body.Channel}`,
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: credentials.basicAuthHeader,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    const rawResponse = JSON.parse(text) as HubtelDirectReceiveMoneyResponse;

    const outcome = mapHubtelResponseCode(
      rawResponse.ResponseCode,
      rawResponse.Message,
    );

    if (outcome.kind === 'failed' && outcome.isMerchantConfig) {
      this.logger.warn(
        `Hubtel Direct Receive: merchant config error schoolId=${params.school.id} responseCode=${rawResponse.ResponseCode ?? '(none)'} reason=${outcome.reason}`,
      );
    } else {
      this.logger.log(
        `Hubtel Direct Receive: result schoolId=${params.school.id} clientReference=${params.clientReference} httpStatus=${response.status} responseCode=${rawResponse.ResponseCode ?? '(none)'} mappedStatus=${outcome.status}`,
      );
    }

    return {
      outcome,
      rawResponse,
      hubtelTransactionId:
        rawResponse.Data?.TransactionId?.toString().trim() || null,
      httpStatus: response.status,
      primaryCallbackUrl,
    };
  }
}
