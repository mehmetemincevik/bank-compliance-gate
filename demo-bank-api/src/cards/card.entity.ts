import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column({ length: 19 })
  cardNumber: string;

  @Column({ length: 4 })
  cvv: string;

  @Column({ length: 5 })
  expiry: string;

  @Column()
  holderName: string;

  @CreateDateColumn()
  createdAt: Date;
}
