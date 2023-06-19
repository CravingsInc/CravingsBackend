import { Resolver, Mutation, Arg, Query } from "type-graphql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import * as models from "../models";

import { Utils, stripeHandler } from "../utils";

@Resolver()
export class UserResolver {
    @Mutation( returns => String )
    async CreateUserAccount( @Arg("username") username: string, @Arg("email") email: string, @Arg("password") password: string ) {
        let user : models.Users;

        if ( username.length < 1 || email.length < 1 || password.length < 1 || !(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(email)) throw new Utils.CustomError("Please fill out form correctly");

        // This will only throw an error if the username is not unique. And if isn't then we want to have a custom error to catch.
        try {
            user = await models.Users.create({
                username,
                email,
                password: await bcrypt.hash(password, 12)
            }).save();
        }catch(e) { 
            console.log(e);
            throw new Utils.CustomError("Username Already exist"); 
        };

        if ( user ) {
            try {
                user.stripeCustomerId = ( await stripeHandler.createCustomer(email, user.id) ).id;
                await user.save();

            }catch(e) {
                console.log(e)
                await user.remove(); // If there was a error then the user will be removed since they will most likely wanna recreate account and try again
                throw new Utils.CustomError("Problem Creating Customer Account") 
            };

            return jwt.sign(
                {
                    ...await Utils.generateJsWebToken(user.id),
                    type: "user"
                }, 
                Utils.SECRET_KEY, 
                { expiresIn: "2w" }
            );
        }
    }

    @Mutation( returns => String ) 
    async UserLogIn( @Arg("username") username: string, @Arg("password") password: string ) {
        let user = await models.Users.findOne({ where: { username } });

        if ( !user ) user = await models.Users.findOne({ where: { email: username }}) // Just incase they are using there email

        if ( user ) {
            if ( await bcrypt.compare(password, user.password) ) {
                return jwt.sign(
                    {
                        ...await Utils.generateJsWebToken(user.id),
                        type: "user"
                    },
                    Utils.SECRET_KEY,
                    { expiresIn: "2w" }
                );
            }
        }

        throw new Utils.CustomError("Invalid credentials. Please try again")
    }

    @Query( () => [models.FoodSummary])
    async getUserOrderItAgain(@Arg("token") token: string, @Arg("limit", { defaultValue: 50 }) limit: number ) {
        let user = await Utils.getUserFromJsWebToken(token);

        let orderItAgain: ( { FTLong: number, FTLat: number, ULong: number | null, ULat: number | null } & models.FoodSummary)[] = await models.UserCart.createQueryBuilder("uc")
        .select(`
            ftf.id, ftf.foodName as name, ftf.profilePicture, ftf.cost as price,
            u.id = uff.userId as hearted,
            0 as miles, "-" as timeToDestination,
            ft.profilePicture as foodTruckProfilePicture, ft.truckName as foodTruckName,
            (
                select sum(quantity) from [user_cart_items] ucil where ucil.foodTruckFoodId = ftf.id
            ) as orderCount,
            (
                select count(id) from [food_truck_rating] ftr1 where ftr1.truckId = ftr.id
            ) as foodTruckRatingsCount,
            (
            select avg(rating) from [food_truck_rating] ftr1 where ftr1.truckId = ftr.id
            ) as foodTruckRatingsAverage,
            ft.longitude as FtLong, ft.Latitude as FTLat,
            u.longitude as ULong, u.latitude as ULat
        `)
        .leftJoin("food_trucks", "ft", "ft.id = uc.foodTruckId")
        .leftJoin("user_cart_items", "uci", "uci.cartId = uc.id")
        .leftJoin("food_trucks_food", "ftf", "ftf.id = uci.foodTruckFoodId")
        .leftJoin("food_truck_rating", "ftr", "ftr.truckId = ft.id")
        .leftJoin("user_favorite_food", "uff", "uff.foodTruckFoodId = ftf.id")
        .leftJoin("users", "u", `u.id = uc.userId and u.id = "${user.id}"`)
        .orderBy("uci.dateUpdated", "DESC")
        .limit( limit <= 50 ? limit : 100 )
        .getRawMany()

        return orderItAgain.map( async ( val ) => {
            let miles = Math.round(Utils.getMiles({ longitude: val.ULong || 0, latitude: val.ULat || 0 }, { longitude: val.FTLong || 0, latitude: val.FTLat || 0 }))
            return {
                id: val.id,
                name: val.name,
                profilePicture: val.profilePicture,
                hearted: Boolean(val.hearted) || false,
                miles: Utils.shortenNumericStrign(miles),
                timeToDestination: Utils.shortenMinutesToString(miles * 2), // To minitus per mile
                orderCount: val.orderCount || 0,
                price: val.price,
                foodTruckName: val.foodTruckName,
                foodTruckProfilePicture: val.foodTruckProfilePicture,
                foodTruckRatingsCount: val.foodTruckRatingsCount,
                foodTruckRatingsAverage: val.foodTruckRatingsAverage || 0
            }
        })
    }

    @Query( () => [models.FoodSummary] )
    async getUserFavoriteFood( @Arg('token') token: string, @Arg("limit", { defaultValue: 50 }) limit: number ) {
        let user = await Utils.getUserFromJsWebToken(token);

        let favoriteFoods: ( { FTLong: number, FTLat: number, ULong: number | null, ULat: number | null } & models.FoodSummary)[] = await models.FoodTrucksFood.createQueryBuilder("ftf")
        .select(`
            ftf.id, ftf.foodName as name, ftf.profilePicture, ftf.cost as price,
            u.id = uff.userId as hearted,
            0 as miles, "-" as timeToDestination,
            ft.profilePicture as foodTruckProfilePicture, ft.truckName as foodTruckName,
            (
                select sum(quantity) from [user_cart_items] uci1 where uci1.foodTruckFoodId = ftf.id
            ) as orderCount,
            (
                select count(id) from [food_truck_rating] ftr1 where ftr1.truckId = ftr.id
            ) as foodTruckRatingsCount,
            (
                select avg(rating) from [food_truck_rating] ftr1 where ftr1.truckId = ftr.id
            ) as foodTruckRatingsAverage,
            ft.longitude as FtLong, ft.Latitude as FTLat,
            u.longitude as ULong, u.Latitude as ULat
        `)
        .leftJoin("food_trucks", "ft", "ft.id = ftf.ownerId")
        .leftJoin("user_favorite_food", "uff", "ftf.id = uff.foodTruckFoodId")
        .leftJoin("users", "u", `u.id = uff.userId and u.id='${user.id}'`)
        .leftJoin("user_cart_items", "uci", "uci.foodTruckFoodId = ftf.id")
        .leftJoin("food_truck_rating", "ftr", "ftr.truckId = ft.id")
        .where(`hearted = 1`)
        .limit( limit <= 50 ? limit : 100 )
        .getRawMany();

        return favoriteFoods.map( async ( val ) => {
            let miles = Math.round(Utils.getMiles({ longitude: val.ULong || 0, latitude: val.ULat || 0 }, { longitude: val.FTLong || 0, latitude: val.FTLat || 0 }))
            return {
                id: val.id,
                name: val.name,
                profilePicture: val.profilePicture,
                hearted: Boolean(val.hearted) || false,
                miles: Utils.shortenNumericStrign(miles),
                timeToDestination: Utils.shortenMinutesToString(miles * 2), // To minitus per mile
                orderCount: val.orderCount || 0,
                price: val.price,
                foodTruckName: val.foodTruckName,
                foodTruckProfilePicture: val.foodTruckProfilePicture,
                foodTruckRatingsCount: val.foodTruckRatingsCount,
                foodTruckRatingsAverage: val.foodTruckRatingsAverage || 0
            }
        })
    }
}
