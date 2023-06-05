import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { FoodTrucksFood } from "./FoodTrucksFood";
import { FoodTruckRating } from "./FoodTruckRating";
import { UserCart } from "./UserCart";

@ObjectType()
@Entity()
export class FoodTrucks extends BaseEntity {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column()
    truckName: string;

    @Field()
    @Column()
    email: string;

    @Column()
    password: string;

    @Field()
    @Column({ default: "", nullable: true })
    profilePicture: string;

    @Field()
    @Column({ default: "", nullable: true })
    bannerImage: string;

    @Field()
    @Column({ default: "", nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    stripeConnectId: string;

    @Field()
    @Column({ default: 0, nullable: true })
    latitude: number;

    @Field()
    @Column({ default: 0, nullable: true })
    longitude: number;

    @Field( () => [FoodTrucksFood] )
    @OneToMany( () => FoodTrucksFood, food => food.owner )
    foods: FoodTrucksFood[];

    @Field( () => [FoodTruckRating] )
    @OneToMany( () => FoodTruckRating, ratings => ratings.truck )
    ratings: FoodTruckRating[];

    @Field( () => [UserCart] )
    @OneToMany( () => UserCart, ratings => ratings.foodTruck )
    orders: UserCart[];

    @Field()
    @CreateDateColumn()
    dateJoined: Date;
    
}
