import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HubtelService } from './hubtel.service';
import { HubtelInteractionRequestDto } from './dto/hubtel-interaction-request.dto';
import { HubtelFulfilmentRequestDto } from './dto/hubtel-fulfilment-request.dto';

@ApiTags('Hubtel Integrations')
@Controller('integrations/hubtel')
export class HubtelController {
  constructor(private readonly hubtelService: HubtelService) {}

  @Post('interaction')
  async interaction(@Body() payload: HubtelInteractionRequestDto) {
    return this.hubtelService.handleInteraction(payload);
  }

  @Post('fulfilment')
  async fulfilment(@Body() payload: HubtelFulfilmentRequestDto) {
    return this.hubtelService.handleFulfilment(payload);
  }
}
