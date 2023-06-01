import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from "typeorm"
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
    @ManyToOne( () => Users, user => user.favoriteFoods, {onDelete: "CASCADE"} )
    user: Users;

    @Field( () => FoodTrucksFood )
    @ManyToOne( () => FoodTrucksFood, food => food.userFavoriteFood, {onDelete: "CASCADE"} )
    foodTruckFood: FoodTrucksFood;

    @Field()
    @CreateDateColumn()
    dateCreated: Date;
}
