import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class FoodTruckSummary {
    @Field()
    id: String;

    @Field()
    name: string;

    @Field()
    profilePicture: string;

    @Field()
    miles: string;

    @Field()
    timeToDestination: string;

    @Field()
    itemsCount: number;

    @Field()
    ratingsAverage: number;

    @Field()
    ratingsCount: number;
}
