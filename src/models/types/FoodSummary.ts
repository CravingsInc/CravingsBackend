import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class FoodSummary {
    @Field()
    id: string;

    @Field()
    name: string;

    @Field()
    profilePicture: string;

    @Field()
    hearted: boolean;

    @Field()
    miles: string;

    @Field()
    timeToDestination: string;

    @Field()
    orderCount: number;

    @Field()
    price: number;

    @Field()
    foodTruckName: string;

    @Field()
    foodTruckProfilePicture: string;

    @Field()
    foodTruckRatingsCount: number;

    @Field()
    foodTruckRatingsAverage: number;
}
