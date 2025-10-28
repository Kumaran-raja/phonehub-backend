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

  @Column({ type: "double precision" })
  amount!: number;

  @Column({ type: "varchar", length: 255 })
  bidderName!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @ManyToOne(() => Auction, (auction) => auction.bids, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "auctionId" })
  auction!: Auction;

  @Column()
  auctionId!: number; 
}
