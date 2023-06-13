import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, BaseEntity } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { FoodTrucks } from "./FoodTrucks";
import { UserFavoriteFood } from "./UserFavoriteFood";
import { UserCartItems } from "./UserCartItems";

@Entity()
@ObjectType()
export class FoodTrucksFood extends BaseEntity {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column()
    foodName: string;

    @Field()
    @Column()
    profilePicture: string;

    @Field()
    @Column({ default: 0, nullable: true })
    calories: number;

    @Field()
    @Column()
    cost: number;

    @Field()
    @Column()
    stripeProductId: string;

    @Field()
    @Column({ default: "", nullable: true })
    description: string;

    @Field()
    @Column("text", { array: true, nullable: true })
    tags: string[];

    @Field( () => FoodTrucks )
    @ManyToOne( () => FoodTrucks, truck => truck.foods, {onDelete: "CASCADE"} )
    owner: FoodTrucks;

    @Field( () => [UserFavoriteFood] )
    @OneToMany( () => UserFavoriteFood, favoriteFood => favoriteFood.foodTruckFood )
    userFavoriteFood: UserFavoriteFood[];

    @Field( () => [UserCartItems] )
    @OneToMany( () => UserCartItems, cartItems => cartItems.foodTruckFood )
    cartItems: UserCartItems[];

    @Field()
    @CreateDateColumn()
    dateCreated: Date;
}
