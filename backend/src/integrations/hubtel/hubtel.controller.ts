import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HubtelService } from './hubtel.service';
import { HubtelInteractionRequestDto } from './dto/hubtel-interaction-request.dto';

@ApiTags('Hubtel Integrations')
@Controller('integrations/hubtel')
export class HubtelController {
  constructor(private readonly hubtelService: HubtelService) {}

  @Post('interaction')
  async interaction(@Body() payload: HubtelInteractionRequestDto) {
    return this.hubtelService.handleInteraction(payload);
  }

  /** No-op: Hubtel "Service callback URL" may still point here; payments use Direct Receive instead. */
  @Post('fulfilment')
  @HttpCode(200)
  @ApiOperation({ summary: 'Legacy fulfilment stub (200 OK, no processing)' })
  fulfilmentStub(@Body() _body: unknown) {
    return { ok: true };
  }
}
