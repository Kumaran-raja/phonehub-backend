import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// Define user roles as enum
export enum SellerType {
  INDIVIDUAL = "individual",
  Business = "business",
}

@Entity("users") // optional table name
export class User {
  @PrimaryGeneratedColumn() // auto-increment primary key
  id!: number;

  @Column({ type: "varchar", unique: true, length: 255 })
  email!: string;

   @Column({ type: "varchar", unique: true, length: 255 })
  username!: string;

  @Column({ type: "varchar", unique: true, length: 255 })
  phone!: string;

  @Column({ type: "varchar", unique: true, length: 255 })
  city!: string;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @Column({
    type: "enum",
    enum: SellerType,
    default: SellerType.INDIVIDUAL,
  })
  sellertype!: SellerType;

  @Column({type:"varchar",length:255})
  storename!:string

  @Column({type:"varchar",length:255})
  storeaddress!:string

  @Column({type:"varchar",length:255})
  tradelicence!:string //image path
}
