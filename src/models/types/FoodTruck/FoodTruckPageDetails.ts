import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class FoodTruckPageDetails {
    @Field( () => ID ) id: string;

    @Field() name: string;

    @Field() profilePicture: string;

    @Field() bannerImage: string;

    @Field() salesCount: number;

    @Field() ratingsCount: number;

    @Field() ratingsAverage: number;

    @Field( () => [FoodTruckPageFoodDetails] )
    foods: FoodTruckPageFoodDetails[]
    
    @Field( () => [FoodTruckPageRatingsDetails] )
    ratings: FoodTruckPageRatingsDetails[];
}

@ObjectType()
export class FoodTruckPageRatingsDetails {
    @Field( () => ID ) id: string;

    @Field() name: string;

    @Field() profilePicture: string;

    @Field() comment: string;

    @Field() rating: number;
}

@ObjectType()
export class FoodTruckPageFoodDetails {
    @Field( () => ID ) id: string;

    @Field() name: string;

    @Field() profilePicture: string;

    @Field() calories: number;

    @Field() cost: number;

    @Field() description: string;
}
