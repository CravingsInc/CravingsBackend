import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Users } from "./User";
import { FoodTrucks } from "./FoodTrucks";

@ObjectType()
@Entity()
export class FoodTruckRating {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column({ default: 0, nullable: false })
    rating: number;

    @Field()
    @Column({ default: "", nullable: false })
    description: string;

    @Field( () => Users )
    @ManyToOne( () => Users, user => user.ratings )
    user: Users;

    @Field( () => FoodTrucks )
    @ManyToOne( () => FoodTrucks, foodTruck => foodTruck.ratings )
    truck: FoodTrucks;

    @Field()
    @CreateDateColumn()
    dateCreated: Date;

}
