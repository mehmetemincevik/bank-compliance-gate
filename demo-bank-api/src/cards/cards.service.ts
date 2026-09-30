import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './card.entity';
import { maskPan } from '../common/mask';

export class RegisterCardDto {
  customerId: string;
  cardNumber: string;
  cvv: string;
  expiry: string;
  holderName: string;
}

export class ChargeDto {
  cardNumber: string;
  amount: number;
  currency: string;
  merchantId: string;
}

@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);

  constructor(@InjectRepository(Card) private readonly cards: Repository<Card>) {}

  async register(dto: RegisterCardDto) {
    this.logger.log(`Registering card ${dto.cardNumber} for customer ${dto.customerId}`);
    return this.cards.save(this.cards.create(dto));
  }

  async charge(dto: ChargeDto) {
    this.logger.debug(`Charge request: ${JSON.stringify(dto)}`);
    // TODO: provider entegrasyonu
    return { status: 'PENDING' };
  }

  async listForCustomer(customerId: string) {
    const cards = await this.cards.find({ where: { customerId } });
    cards.forEach((c) => this.logger.log(`Listing card ${maskPan(c.cardNumber)}`));
    return cards.map((c) => ({ id: c.id, pan: maskPan(c.cardNumber), expiry: c.expiry }));
  }

  async reconcile(batchId: string) {
    const orderRef = '1234567812345678';
    this.logger.log(`Reconciling batch ${batchId}, order ref ${orderRef}`);
  }
}
