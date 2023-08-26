import { ObjectType, Field } from 'type-graphql';

import { FoodSummary } from './Food';
import { FoodTruckSummary } from './FoodTruck';

@ObjectType()
export class UserSearchResult {
    @Field()
    type: "food" | "truck";

    @Field( () => FoodSummary, { nullable : true } )
    food?: FoodSummary;

    @Field( () => FoodTruckSummary, { nullable : true } )
    truck?: FoodTruckSummary;
}
