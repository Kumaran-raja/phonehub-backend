import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Bulk {
  @PrimaryGeneratedColumn()
  id!: number;

  // 🔹 Basic Info
  @Column()
  model!: string;

  @Column()
  storage!: string;

  @Column({ nullable: true })
  variant?: string;

  @Column({ nullable: true })
  deviceRegion?: string;

  @Column({ nullable: true })
  condition?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  description?: string;

  // 🔹 Pricing
  @Column({ type: "float", default: 0 })
  price!: number;

  @Column({ type: "int", default: 1 })
  quantity!: number;

  @Column({ type: "float", default: 0 })
  unitPrice!: number;

  @Column({ type: "float", default: 0 })
  totalPrice!: number;

  // 🔹 MOQ & Pricing tiers
  @Column({ nullable: true })
  moqType?: "starter" | "standard" | "custom";

  @Column({ type: "int", nullable: true })
  customMoq?: number;

  @Column("simple-json", { nullable: true })
  pricingTiers?: {
    range: string;
    price: number;
    discount: string;
  }[];

  // 🔹 Bulk Features
  @Column("simple-json", { nullable: true })
  bulkFeatures?: {
    name: string;
    title: string;
    description: string;
    selected: boolean;
  }[];

  // 🔹 Seller Info
  @Column({ default: "individual" })
  sellerType!: "individual" | "business";

  @Column()
  sellerName!: string;

  @Column({ nullable: true })
  sellerPhone?: string;

  // 🔹 Media
  @Column("simple-array", { nullable: true })
  images?: string[];

  // 🔹 Status / Meta
  @Column({ nullable: true })
  badgeType?: string;

  @Column({ nullable: true })
  badgeText?: string;

  @Column({ type: "float", default: 0 })
  rating!: number;

  @Column({ default: false })
  verified!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
