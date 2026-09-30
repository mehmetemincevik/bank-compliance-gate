import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { encrypted } from '../common/encrypted.transformer';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ length: 11 })
  tckn: string;

  @Column({ transformer: encrypted })
  email: string;

  @Column({ type: 'text', nullable: true })
  healthNote: string | null;

  @Column({ default: 'tr' })
  preferredLanguage: string;

  @Column({ default: 0 })
  riskScore: number;
}
