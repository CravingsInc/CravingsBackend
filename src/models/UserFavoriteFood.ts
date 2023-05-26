import { Entity, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { FoodTrucksFood } from "./FoodTrucksFood";
import { Users } from "./User";

@Entity()
@ObjectType()
export class UserFavoriteFood {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field( () => Users )
    @OneToMany( () => Users, user => user.favoriteFoods )
    user: Users;

    @Field( () => [FoodTrucksFood] )
    @OneToMany( () => FoodTrucksFood, food => food.userFavoriteFood )
    foodTruckFood: FoodTrucksFood[];

    @Field()
    @CreateDateColumn()
    dateCreated: Date;
}
