import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Users } from "./User";
import { FoodTrucks } from "./FoodTrucks";
import { UserCartItems } from "./UserCartItems";

export enum UserCartStatus {
    PAY = "PAY",
    PREPARING = "PREPARING",
    DONE = "DONE",
};

@Entity()
@ObjectType()
export class UserCart {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field( () => Users )
    @ManyToOne( () => Users, user => user.carts, {onDelete: "CASCADE"} )
    user: Users;

    @Field( () => FoodTrucks )
    @ManyToOne( () => FoodTrucks, foodTruck => foodTruck.orders, {onDelete: "CASCADE"} )
    foodTruck: FoodTrucks;

    @Field( () => [UserCartItems] )
    @OneToMany( () => UserCartItems, userCartItems => userCartItems.cart )
    cartItems: UserCartItems[];

    @Field()
    @Column()
    cartCompleted: boolean; // Is the cart paid for

    @Field()
    @Column({ default: UserCartStatus.PAY })
    cartStatus: UserCartStatus;

    @Field()
    @Column({ type: "datetime", default: () => '(CURRENT_DATE)' })
    dateCompleted: Date;

    @Field()
    @Column({ type: "datetime", default: () => '(CURRENT_DATE)' })
    datePaidFor: Date;

    @Field()
    @CreateDateColumn()
    dateCreated: Date;
}


