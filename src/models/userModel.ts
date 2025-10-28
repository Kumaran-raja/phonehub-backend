// models/userModel.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { FixedPrice } from "./FixedPrice";
import { Bulk } from "./BulkData";

export enum SellerType {
  INDIVIDUAL = "individual",
  BUSINESS = "business",
  BUYER = "buyer",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", unique: true, length: 255 })
  username!: string;

  @Column({ type: "varchar", unique: true, length: 255 })
  phone!: string;

  @Column({ type: "varchar", length: 255 })
  city!: string;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @Column({
    type: "enum",
    enum: SellerType,
    default: SellerType.BUYER,
  })
  sellertype!: SellerType;

  @Column({ type: "varchar", length: 255 })
  storename!: string;

  @Column({ type: "varchar", length: 255 })
  storeaddress!: string;

  @Column({ type: "varchar", length: 255 })
  tradelicence!: string;

  @Column({ type: "boolean", default: false })
  isVerified!: boolean;

  @Column({ type: "varchar", length: 6, nullable: true })
  emailOtp!: string | null;

  @OneToMany(() => Bulk, (bulk) => bulk.user)
bulkListings!: Bulk[];


  @OneToMany(() => FixedPrice, (fixed) => fixed.user)
  fixedPrices!: FixedPrice[];
}
