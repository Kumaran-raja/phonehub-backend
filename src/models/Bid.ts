import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Auction } from "./Auction";

@Entity()
export class Bid {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Auction, (auction) => auction.bids, { onDelete: "CASCADE" })
  @JoinColumn({ name: "auctionId" })
  auction!: Auction;

  @Column()
  auctionId!: number;

  @Column({ length: 100 })
  bidderName!: string;

  @Column({ type: "double precision" })
  amount!: number;

  @Column({ length: 30, default: "bid" })
  action!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;
}
