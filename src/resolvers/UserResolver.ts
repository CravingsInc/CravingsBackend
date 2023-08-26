import { Resolver, Mutation, Arg, Query } from "type-graphql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import * as models from "../models";

import { Utils, stripeHandler } from "../utils";
import { Like } from "typeorm";

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
            ft.longitude as FTLong, ft.Latitude as FTLat,
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
                miles: Utils.shortenNumericString(miles),
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
            ft.longitude as FTLong, ft.Latitude as FTLat,
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
                miles: Utils.shortenNumericString(miles),
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

    @Query( () => [ models.FoodTruckSummary ])
    async getPopularLocalFoodTruck( @Arg('token') token: string, @Arg("limit", { defaultValue: 50 } ) limit: number ) {
        let user = await Utils.getUserFromJsWebToken(token);

        let popularLocalFoodTruck : ( { FLong: number, FLat: number, ULong: number | null, ULat: number | null } & models.FoodTruckSummary)[] 
            = await models.FoodTrucks.createQueryBuilder('ft')
            .select(`
                ft.id, ft.truckName  as name, ft.profilePicture, ft.longitude as FLong, ft.latitude as FLat,
                (
                    select count(*) from food_trucks_food ftf where ftf.ownerId = ft.id
                ) as itemsCount,
                (
                    select count(id) from food_truck_rating ftr where ftr.truckId = ft.id
                ) as ratingsCount,
                (
                    select avg(rating) from food_truck_rating ftr where ftr.truckId = ft.id
                ) as ratingsAverage,
                u.latitude as ULat, u.longitude as ULong
            `)
            .leftJoin("users", 'u', `u.id='${user.id}'`)
            .where(`
                (
                    ( u.searchMilesRadius * u.searchMilesRadius ) - (
                        (
                            ( u.longitude - ft.longitude ) * ( u.longitude - ft.longitude )
                        ) + 
                        (
                            ( u.Latitude - ft.Latitude ) * ( u.Latitude - ft.Latitude )
                        )
                    )
                ) >= 0
            `).orderBy(`ratingsCount`, "DESC")
            .limit( limit <= 50 ? limit : 100 )
            .getRawMany();

        return popularLocalFoodTruck.map( ( val ) => {
            let miles = Math.round(Utils.getMiles({ longitude: val.ULong || 0, latitude: val.ULat || 0 }, { longitude: val.FLong || 0, latitude: val.FLat || 0 }))
    
            return {
                id: val.id,
                name: val.name,
                profilePicture: val.profilePicture,
                miles: Utils.shortenNumericString(miles),
                timeToDestination: Utils.shortenMinutesToString(miles * 2), // To minitus per mile
                itemsCount: val.itemsCount,
                ratingsAverage: val.ratingsAverage || 0,
                ratingsCount: val.ratingsCount,
                milesNum: miles
            }
        }).filter( val => val.milesNum <= user.searchMilesRadius + Utils.milesFilterLeway );
    } 

    @Query( () => [models.FoodSummary] )
    async getPopularLocalFood( @Arg('token') token: string, @Arg("limit", { defaultValue: 50 }) limit: number ) {
        let user = await Utils.getUserFromJsWebToken(token);

        let popularLocalFood: ( { FTLong: number, FTLat: number, ULong: number | null, ULat: number | null } & models.FoodSummary)[] = await models.FoodTrucksFood.createQueryBuilder("ftf")
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
            ft.longitude as FTLong, ft.Latitude as FTLat,
            u.longitude as ULong, u.Latitude as ULat
        `)
        .leftJoin("food_trucks", "ft", "ft.id = ftf.ownerId")
        .leftJoin("user_favorite_food", "uff", "ftf.id = uff.foodTruckFoodId")
        .leftJoin("users", "u", `u.id = uff.userId and u.id='${user.id}'`)
        .leftJoin("user_cart_items", "uci", "uci.foodTruckFoodId = ftf.id")
        .leftJoin("food_truck_rating", "ftr", "ftr.truckId = ft.id")
        .where(`
            (
                ( u.searchMilesRadius * u.searchMilesRadius ) - (
                    (
                        ( u.longitude - ft.longitude ) * ( u.longitude - ft.longitude )
                    ) + 
                    (
                        ( u.Latitude - ft.Latitude ) * ( u.Latitude - ft.Latitude )
                    )
                )
            ) >= 0
        `).orderBy(`orderCount`, "DESC")
        .limit( limit <= 50 ? limit : 100 )
        .getRawMany();


        return popularLocalFood.map( ( val ) => {
            let miles = Math.round(Utils.getMiles({ longitude: val.ULong || 0, latitude: val.ULat || 0 }, { longitude: val.FTLong || 0, latitude: val.FTLat || 0 }))
            return {
                id: val.id,
                name: val.name,
                profilePicture: val.profilePicture,
                hearted: Boolean(val.hearted) || false,
                miles: Utils.shortenNumericString(miles),
                timeToDestination: Utils.shortenMinutesToString(miles * 2), // To minitus per mile
                orderCount: val.orderCount || 0,
                price: val.price,
                foodTruckName: val.foodTruckName,
                foodTruckProfilePicture: val.foodTruckProfilePicture,
                foodTruckRatingsCount: val.foodTruckRatingsCount,
                foodTruckRatingsAverage: val.foodTruckRatingsAverage || 0,
                milesNum: miles
            }
        }).filter( val => val.milesNum <= user.searchMilesRadius + Utils.milesFilterLeway );
    }

    @Query( () => [models.UserSearchResult] ) 
    async userSearch( @Arg("token") token: string, @Arg("searchTerm") searchTerm: string ) {
        let user = await Utils.getUserFromJsWebToken(token);

        let trucks = await models.FoodTrucks.createQueryBuilder('ft')
        .select(`
            ft.id, ft.truckName  as name, ft.profilePicture, ft.longitude as FLong, ft.latitude as FLat,
            (
                select count(*) from food_trucks_food ftf where ftf.ownerId = ft.id
            ) as itemsCount,
            (
                select count(id) from food_truck_rating ftr where ftr.truckId = ft.id
            ) as ratingsCount,
            (
                select avg(rating) from food_truck_rating ftr where ftr.truckId = ft.id
            ) as ratingsAverage,
            u.latitude as ULat, u.longitude as ULong
        `)
        .leftJoin("users", 'u', `u.id='${user.id}'`)
        .where( { truckName: Like(`%${searchTerm}%`) } )
        .limit( 50 ).getRawMany();
    
        let foods = await models.FoodTrucksFood.createQueryBuilder("ftf")
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
            ft.longitude as FTLong, ft.Latitude as FTLat,
            u.longitude as ULong, u.Latitude as ULat
        `)
        .leftJoin("food_trucks", "ft", "ft.id = ftf.ownerId")
        .leftJoin("user_favorite_food", "uff", "ftf.id = uff.foodTruckFoodId")
        .leftJoin("users", "u", `u.id = uff.userId and u.id='${user.id}'`)
        .leftJoin("user_cart_items", "uci", "uci.foodTruckFoodId = ftf.id")
        .leftJoin("food_truck_rating", "ftr", "ftr.truckId = ft.id")
        .where([
            { foodName: Like(`%${searchTerm}%`) },
            { description: Like(`%${searchTerm}%`) },
            { tags: Like(`%${searchTerm}%`) }
        ]).orWhere(`ft.truckname like "%${searchTerm}%"`)
        .limit(50).getRawMany();

        let results = [
            ...(
                trucks.map( t => {
                    let miles = Math.round(Utils.getMiles({ longitude: t.ULong || 0, latitude: t.ULat || 0 }, { longitude: t.FLong || 0, latitude: t.FLat || 0 }))
    
                    return { 
                        truck: {
                            id: t.id,
                            name: t.name,
                            profilePicture: t.profilePicture,
                            miles: Utils.shortenNumericString(miles),
                            timeToDestination: Utils.shortenMinutesToString(miles * 2), // To minitus per mile
                            itemsCount: t.itemsCount,
                            ratingsAverage: t.ratingsAverage || 0,
                            ratingsCount: t.ratingsCount,
                            milesNum: miles
                        }, 
                        type: "truck" 
                    }
                })
            ),

            ...(
                foods.map( f => {
                    let miles = Math.round(Utils.getMiles({ longitude: f.ULong || 0, latitude: f.ULat || 0 }, { longitude: f.FTLong || 0, latitude: f.FTLat || 0 }))
                    
                    return { 
                        food: {
                            id: f.id,
                            name: f.name,
                            profilePicture: f.profilePicture,
                            hearted: Boolean(f.hearted) || false,
                            miles: Utils.shortenNumericString(miles),
                            timeToDestination: Utils.shortenMinutesToString(miles * 2), // To minitus per mile
                            orderCount: f.orderCount || 0,
                            price: f.price,
                            foodTruckName: f.foodTruckName,
                            foodTruckProfilePicture: f.foodTruckProfilePicture,
                            foodTruckRatingsCount: f.foodTruckRatingsCount,
                            foodTruckRatingsAverage: f.foodTruckRatingsAverage || 0,
                            milesNum: miles
                        }, 
                        type: "food" 
                    }
                })
            )
        ];

        return results;
    }
    
    @Query( () => models.UserProfileInformation ) 
    async getUserProfileInformation( @Arg('token') token: string ) {
        let user = await Utils.getUserFromJsWebToken(token);

        return {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            phoneNumber: user.phoneNumber,
            email: user.email
        }
    }

    @Mutation( () => String )
    async modifyUserProfileInformation( @Arg('token') token: string, @Arg('arg', () => models.UserProfileInformationInput ) arg : models.UserProfileInformationInput ) {
        let user = await Utils.getUserFromJsWebToken(token);

        user.firstName = arg.firstName
        user.lastName = arg.lastName
        user.username = arg.username
        user.phoneNumber = arg.phoneNumber
        user.email = arg.email

        await user.save();

        return "Modified Properly";
    }

    @Mutation( () => String )
    async changePassword( @Arg("token") token: string ) {
        let user = await Utils.getUserFromJsWebToken(token);

        let passwordChange = await models.UserPasswordChange.create({
            user
        }).save();

        let link_to_open = `${Utils.getCravingsWebUrl()}/change-password/${
            jwt.sign(
                {
                    ...await Utils.generateJsWebToken(user.id),
                    type: "user",
                    command: "change-password",
                    pwc: passwordChange.id
                }, 
                Utils.SECRET_KEY, 
                { expiresIn: 10 * 60 } // Expires in 10 minutes
            )
        }`;

        await Utils.Mailer.sendPasswordChangeEmail({ link_to_open, email: user.email, username: user.username });

        return link_to_open;
    }

    @Query( () => String )
    async verifyPasswordChangeToken( @Arg('token') token: string ) {
        let pwc = await Utils.verifyPasswordChangeToken(token);

        if ( pwc.tokenUsed ) return "Token is not valid";

        return "Token is valid";
    }

    @Mutation( () => String )
    async confirmUserPasswordChange( @Arg('token') token: string, @Arg('newPassword') newPassword: string, @Arg('confirmNewPassword') confirmNewPassword: string ) {
        
        if ( newPassword.length < 1 || confirmNewPassword.length < 1 ) return "Can't change your password";

        if ( newPassword !== confirmNewPassword ) return "Can't change your password";
        
        let pwc = await Utils.verifyPasswordChangeToken(token);

        if ( pwc.tokenUsed ) return "Can't change password";

        let user = await models.Users.findOne({ where: { id: pwc.user.id } });

        if ( !user ) return "Problem changing your password";

        user.password = await bcrypt.hash(newPassword, 12);

        pwc.tokenUsed = true;

        await pwc.save();
        await user.save();

        return "Successfully changed your password";
    }
}
