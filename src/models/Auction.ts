import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Bid } from "./Bid";

export type SellerType = "individual" | "business" | "buyer";

@Entity()
export class Auction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  model!: string;

  @Column({ type: "json", nullable: true })
  specs!: { key: string; value: string }[];

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

  @Column({ type: "bigint" })
  durationSeconds!: number;

  @Column({ type: "timestamp" })
  endTime!: Date;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @OneToMany(() => Bid, (bid) => bid.auction, { cascade: true })
  bids!: Bid[];
}
