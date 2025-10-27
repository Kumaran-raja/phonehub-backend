// models/FixedPrice.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./userModel";

export type SellerType = "individual" | "business" | "buyer";
export type SpecKV = { key: string; value: string };

@Entity("fixed_prices")
export class FixedPrice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  model!: string;

  @Column()
  storage!: string;

  @Column()
  price!: string;

  @Column({ type: "json", nullable: true })
  specs!: SpecKV[] | null;

  @Column()
  condition!: string;

  @Column()
  location!: string;

  @Column({ type: "varchar", length: 10, nullable: true })
  batteryHealth!: string | null;

  @Column("text", { nullable: true })
  description!: string | null;

  @Column({ type: "json", nullable: true })
  images!: string[] | null;

  @Column({ type: "varchar", length: 20 })
  sellerType!: SellerType;

  @Column({ type: "varchar", length: 255 })
  sellerName!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  sellerPhone!: string | null;

  @Column({ type: "boolean", default: false })
  verified!: boolean;

  // ✅ Relation with User
  @ManyToOne(() => User, (user) => user.fixedPrices, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column()
  userId!: number;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
