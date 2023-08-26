import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { UserFavoriteFood } from "./UserFavoriteFood";
import { FoodTruckRating } from "./FoodTruckRating";
import { UserCart } from "./UserCart";
import { UserPasswordChange } from "./UserPasswordChange";

@Entity()
@ObjectType()
export class Users extends BaseEntity {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column({ unique: true })
    username: string;

    @Field()
    @Column()
    email: string;

    @Column()
    password: string;

    @Field()
    @Column({ default: "", nullable: true })
    firstName: string;

    @Field()
    @Column({ default: "", nullable: true })
    lastName: string;

    @Field()
    @Column({ default: "", nullable: true })
    profilePicture: string;

    @Field()
    @Column({ default: "", nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    stripeCustomerId: string;

    @Field()
    @Column({ default: 0, nullable: true })
    latitude: number;

    @Field()
    @Column({ default: 0, nullable: true })
    longitude: number;

    @Field()
    @Column({ default: 12, nullable: true })
    searchMilesRadius: number;

    @Field( () => [FoodTruckRating] )
    @OneToMany( () => FoodTruckRating, ratings => ratings.user )
    ratings: FoodTruckRating[];

    @Field( () => [UserFavoriteFood] )
    @OneToMany( () => UserFavoriteFood, favoriteFood => favoriteFood.user )
    favoriteFoods: UserFavoriteFood[];

    @Field( () => [UserCart] )
    @OneToMany( () => UserCart, cart => cart.user )
    carts: UserCart[];

    @OneToMany( () => UserPasswordChange, pwc => pwc.user )
    passwordChangeHistory: UserPasswordChange[];

    @Field()
    @CreateDateColumn()
    dateJoined: Date;

}
