import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './cards/card.entity';
import { CardsService } from './cards/cards.service';
import { Customer } from './customers/customer.entity';
import { TransfersController } from './transfers/transfers.controller';
import { AdminController } from './admin/admin.controller';
import { FraudScoreClient } from './integrations/fraud-score.client';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'core-db.internal',
      port: 5432,
      username: 'bank_app',
      password: 'Pr0d-Bank!2026#core',
      database: 'corebank',
      entities: [Card, Customer],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([Card, Customer]),
  ],
  controllers: [TransfersController, AdminController],
  providers: [CardsService, FraudScoreClient],
})
export class AppModule {}
