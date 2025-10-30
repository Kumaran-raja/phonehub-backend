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

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", unique: true, length: 255 })
  username!: string;

  @Column({ type: "varchar", unique: true, length: 20 })
  phone!: string;

  @Column({ type: "varchar", length: 100 })
  city!: string;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @Column({
    type: "enum",
    enum: SellerType,
    default: SellerType.BUYER,
  })
  sellertype!: SellerType;

  @Column({ type: "varchar", length: 255, nullable: true })
  storename!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  storeaddress!: string | null;

  // @Column({ type: "varchar", length: 255, nullable: true })
  // tradelicence!: string | null;

  @Column({ type: "boolean", default: false })
  isVerified!: boolean;

  @Column({ type: "varchar", length: 6, nullable: true })
  emailOtp!: string | null;

  @Column({ type: "varchar", length: 6, nullable: true })
  resetOtp!: string | null;

  @Column({ type: "datetime", nullable: true })
  resetOtpExpires!: Date | null;

  @OneToMany(() => Bulk, (bulk) => bulk.user)
  bulkListings!: Bulk[];

  @OneToMany(() => FixedPrice, (fixed) => fixed.user)
  fixedPrices!: FixedPrice[];
}
