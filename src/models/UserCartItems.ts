import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { FoodTrucksFood } from "./FoodTrucksFood";
import { UserCart } from "./UserCart";

@Entity()
@ObjectType()
export class UserCartItems {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column()
    quantity: number;

    @Field( () => FoodTrucksFood )
    @ManyToOne( () => FoodTrucksFood, foodTrucksFood => foodTrucksFood.cartItems, {onDelete: "CASCADE"} )
    foodTruckFood: FoodTrucksFood;

    @Field( () => UserCart )
    @ManyToOne( () => UserCart, userCart => userCart.cartItems, {onDelete: "CASCADE"} )
    cart: UserCart;

    @Field()
    @CreateDateColumn()
    dateAdded: Date;

    @Field()
    @UpdateDateColumn()
    dateUpdated: Date;
}
