import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";

export type SellerType = "individual" | "business" | "buyer";

export type SpecKV = { key: string; value: string };

@Entity()
export class FixedPrice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  model!: string;

  @Column()
  storage!: string;

  @Column()
  price!: string; // keep string if you want "AED 3,850" or numeric string; use number if numeric

  // specs stored as JSON array of key/value objects
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

  // images stored as array of URLs (if you upload to S3/Cloud)
  @Column({ type: "json", nullable: true })
  images!: string[] | null;

  @Column({ type: "varchar", length: 20 })
  sellerType!: SellerType;

  @Column({ type: "varchar", length: 255 })
  sellerName!: string;

  // phone to allow querying by seller phone
  @Column({ type: "varchar", length: 50, nullable: true })
  sellerPhone!: string | null;

  @Column({ type: "boolean", default: false })
  verified!: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
