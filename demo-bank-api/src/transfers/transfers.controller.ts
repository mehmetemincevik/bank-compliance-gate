import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Audit } from '../common/audit.decorator';
import { MfaGuard } from '../common/mfa.guard';
import { FraudScoreClient } from '../integrations/fraud-score.client';

class CreateTransferDto {
  fromAccountId: string;
  toIban: string;
  amount: number;
  currency: string;
  description?: string;
}

@Controller('transfers')
export class TransfersController {
  constructor(private readonly fraud: FraudScoreClient) {}

  @Post()
  async create(@Body() dto: CreateTransferDto) {
    const score = await this.fraud.score(dto);
    if (score > 80) return { status: 'HELD_FOR_REVIEW' };
    return { status: 'COMPLETED' };
  }

  @Get(':accountId/history')
  @Audit('transfer.history.read')
  @UseGuards(MfaGuard)
  async history(@Param('accountId') accountId: string) {
    return { accountId, items: [] };
  }
}
