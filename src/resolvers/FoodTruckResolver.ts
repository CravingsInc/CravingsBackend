import { Resolver, Mutation, Query, Arg } from "type-graphql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import * as models from "../models";

import { Utils, stripeHandler } from "../utils";

@Resolver()
export class FoodTruckResolver {
    @Mutation( returns => String )
    async CreateFoodTruckAccount( @Arg("foodTruckName") foodTruckName: string, @Arg("email") email: string, @Arg("password") password: string ) {
        let foodTruck : models.FoodTrucks;

        if ( foodTruckName.length < 1 || email.length < 1 || password.length < 1 || !(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(email)) throw new Utils.CustomError("Please fill out form correctly");

        try {
            foodTruck = await models.FoodTrucks.create({
                truckName: foodTruckName,
                email,
                password: await bcrypt.hash(password, 12)
            }).save();
        }catch(e) {
            console.log(e);
            throw new Utils.CustomError("Food Truck Name Already Exist");
        }

        if ( foodTruck ) {
            try {
                foodTruck.stripeConnectId = ( await stripeHandler.createConnectAccount(email, foodTruck.id ) ).id;
                await foodTruck.save();
            }catch(e) {
                console.log(e);

                await foodTruck.remove();
                throw new Utils.CustomError("Problem Creating Food Truck Account");
            }

            return jwt.sign(
                {
                    ...await Utils.generateJsWebToken(foodTruck.id),
                    type: "foodTruck"
                },
                Utils.SECRET_KEY,
                { expiresIn: "2w" }
            )
        }
    }

    @Mutation( returns => String ) 
    async FoodTruckLogIn( @Arg("truckName") truckName: string, @Arg("password") password: string ) {
        let foodTruck = await models.FoodTrucks.findOne({ where: { truckName } });

        if ( !foodTruck ) foodTruck = await models.FoodTrucks.findOne({ where: { email: truckName }}) // Just incase they are using there email

        if ( foodTruck ) {
            if ( await bcrypt.compare(password, foodTruck.password) ) {
                return jwt.sign(
                    {
                        ...await Utils.generateJsWebToken(foodTruck.id),
                        type: "foodTruck"
                    },
                    Utils.SECRET_KEY,
                    { expiresIn: "2w" }
                );
            }
        }

        throw new Utils.CustomError("Invalid credentials. Please try again")
    }

    
    @Query( () => models.FoodTruckPageDetails )
    async userGetFoodTruckPageDetails( @Arg('token') token: string, @Arg('truckId') truckId: string ) {
        let user = await Utils.getUserFromJsWebToken(token);

        let foodTruck = await models.FoodTrucks.createQueryBuilder("ft")
        .select(`
          ft.id, ft.truckName as name, ft.profilePicture, ft.bannerImage,
          count(uc.id) as salesCount,
          count(ftr.id) as ratingsCount, avg(ftr.rating) as ratingsAverage
        `)
        .leftJoin("food_truck_rating", "ftr", 'ftr.truckId = ft.id')
        .leftJoin("user_cart", "uc", "uc.foodTruckId = ft.id and uc.cartStatus is 'DONE' " )
        .where(`ft.id = "${truckId}"`)
        .getRawOne() as ( { id: string, name: string, profilePicture: string, bannerImage: string, salesCount: number, ratingsCount: number, ratingsAverage: number } | null )

        if ( !foodTruck ) throw new Utils.CustomError("Food Truck does not exist");


        let foodTruckFood = await models.FoodTrucksFood.createQueryBuilder('ftf')
        .select(`
            ftf.id, ftf.foodName as name, ftf.profilePicture, ftf.calories, ftf.cost, ftf.description, 
            "${user.id}" is uff.userId as hearted
        `)
        .leftJoin("user_favorite_food", "uff", `uff.foodTruckFoodId = ftf.id and uff.userId is "${user.id}"`)
        .getRawMany() as ( { id: string, name: string, profilePicture: string, cost: number, calories: number, description: string, hearted: boolean }[] | null )

        let foodTruckRating = await models.FoodTruckRating.createQueryBuilder('ftr')
        .select(`
            ftr.id, u.username as name, u.profilePicture, ftr.rating, ftr.description as comment
        `)
        .leftJoin("users", "u", "u.id = ftr.userId")
        .getRawMany() as ( { id: string, name: string, profilePicture: string, comment: string, rating: number }[] | null )

        return {
            ...foodTruck,
            ratingsAverage: foodTruck.ratingsAverage || 0,
            foods: foodTruckFood,
            ratings: foodTruckRating
        }
    }
}
