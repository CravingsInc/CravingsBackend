import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { FoodTrucks } from "./FoodTrucks";

@Entity()
@ObjectType()
export class FoodTrucksFood {
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
    @Column({ default: "", nullable: true })
    tags: string;

    @Field()
    @ManyToOne( () => FoodTrucks, truck => truck.foods )
    owner: FoodTrucks;

    @Field()
    @CreateDateColumn()
    dateCreated: Date;
}
