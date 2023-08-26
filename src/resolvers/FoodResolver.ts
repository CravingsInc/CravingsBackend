import { Resolver, Query, Mutation, Arg } from "type-graphql";

import { Utils } from "../utils";
import * as models from "../models";

@Resolver()
export class FoodResolver {
    @Query( () => models.FoodDetailsBuy )
    async userGetFoodDetailsBuy( @Arg("token") token: string, @Arg("foodId") id: string ) {
        let user = await Utils.getUserFromJsWebToken(token);

        let food = await models.FoodTrucksFood.createQueryBuilder("ftf")
        .select(`
            ftf.id, ftf.foodName as name, ftf.profilePicture, ftf.ownerId as ownerId , ftf.cost as price,
            ftf.calories, ftf.description,  "${user.id}" is uff.userId as hearted,
            ft.truckName as ownerName, ft.profilePicture as ownerPicture
        `)
        .leftJoin("food_trucks", "ft", "ft.id = ftf.ownerId")
        .leftJoin("user_favorite_food", "uff", `uff.foodTruckFoodId = ftf.id and uff.userId is "${user.id}"`)
        .where(`ftf.id = "${id}"`)
        .getRawOne();

        if ( !food ) throw new Utils.CustomError("Food does not exist");

        return food;
    }
}
