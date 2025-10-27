import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Bid } from "./Bid";

export type SellerType = "individual" | "business";

@Entity()
export class Auction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  model!: string;

  @Column("text")
  specs!: string;

  @Column({ type: "double precision", default: 0 })
  currentBid!: number;

  @Column({ type: "double precision", default: 0 })
  startBid!: number;

  @Column({ type: "int", default: 0 })
  bidsCount!: number;

  @Column({ type: "varchar", length: 20 })
  sellerType!: SellerType;

  @Column({ type: "varchar", length: 255 })
  sellerName!: string;

  // Auction duration in seconds (e.g. 24h = 86400s)
  @Column({ type: "bigint" })
  durationSeconds!: number;

  // Auction end time (auto-calculated on creation)
  @Column({ type: "timestamp" })
  endTime!: Date;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @OneToMany(() => Bid, (bid) => bid.auction, { cascade: true })
  bids!: Bid[];
}
