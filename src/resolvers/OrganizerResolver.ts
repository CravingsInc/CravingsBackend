import { Resolver, Mutation, Query, Arg } from "type-graphql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import * as models from "../models";

import { Utils, stripeHandler } from "../utils";

@Resolver()
export class OrganizerResolver {
    @Mutation( returns => String )
    async CreateOrganizerAccount( @Arg("orgName") orgName: string, @Arg("email") email: string, @Arg("password") password: string ) {
        let organizer : models.Organizers;

        if ( orgName.length < 1 || email.length < 1 || password.length < 1 || !(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(email)) throw new Utils.CustomError("Please fill out form correctly");

        try {
            organizer = await models.Organizers.create({
                orgName: orgName,
                email,
                password: await bcrypt.hash(password, 12)
            }).save();
        }catch(e) {
            console.log(e);
            throw new Utils.CustomError("Food Truck Name Already Exist");
        }

        if ( organizer ) {
            try {
                organizer.stripeConnectId = ( await stripeHandler.createConnectAccount(email, organizer.id ) ).id;
                await organizer.save();
            }catch(e) {
                console.log(e);

                await organizer.remove();
                throw new Utils.CustomError("Problem Creating Food Truck Account");
            }

            return jwt.sign(
                {
                    ...await Utils.generateJsWebToken(organizer.id),
                    type: Utils.LOGIN_TOKEN_TYPE.ORGANIZER
                },
                Utils.SECRET_KEY,
                { expiresIn: "2w" }
            )
        }
    }

    @Mutation( returns => String ) 
    async OrganizerLogIn( @Arg("orgName") orgName: string, @Arg("password") password: string ) {
        let organizer = await models.Organizers.findOne({ where: { orgName } });

        if ( !organizer ) organizer = await models.Organizers.findOne({ where: { email: orgName }}) // Just incase they are using there email

        if ( organizer ) {
            if ( await bcrypt.compare(password, organizer.password) ) {
                return jwt.sign(
                    {
                        ...await Utils.generateJsWebToken(organizer.id),
                        type: Utils.LOGIN_TOKEN_TYPE.ORGANIZER
                    },
                    Utils.SECRET_KEY,
                    { expiresIn: "2w" }
                );
            }
        }

        throw new Utils.CustomError("Invalid credentials. Please try again")
    }

    @Mutation( returns => String )
    async getOrganizerProfile( @Arg("token") token: string ) {
        return await Utils.getOrganizerFromJsWebToken(token);
    }

    @Mutation( returns => String )
    async getOrganizerPage( @Arg('organizerId') organizerId: string, @Arg("userToken", { nullable: true }) userToken?: string ) {
        let user = userToken ? await Utils.getUserFromJsWebToken(userToken) : null;

        let organizer = await models.Organizers.findOneBy({ id: organizerId });

        if ( !organizer ) throw new Utils.CustomError("Invalid organizer. Please try again.")

        await models.OrganizerPageVisit.create({
            guest: user == null,
            user,
            organizer
        }).save();

        return {
            id: organizer.id,
            orgName: organizer.orgName,
            profilePicture: organizer.profilePicture,
            banner: organizer.banner,
            followers: await models.OrganizersFollowers.count({ where: { organizer: { id: organizer.id } } }),
            events: await Promise.all(
                (
                    await models.Events.find({ where: { organizer: { id: organizer.id } } })
                ).map( async e => {
                    let prices = (await stripeHandler.getEventTicketPrices(e.productId))?.data.map(v => v.unit_amount);
    
                    let maxPrice, minPrice = 0;
    
                    if (prices && prices.length > 0) {
                        maxPrice = Math.max(...prices as number[]);
                        minPrice = Math.min(...prices as number[]);
                    }
    
                    return {
                        id: e.id,
                        name: e.title,
                        description: e.description,
                        banner: e.banner,
                        costRange: `$${minPrice}-${maxPrice}`,
                        location: {
                            lat: e.latitude,
                            long: e.longitude
                        }
                    }
                })
            )
        }

    }

    @Mutation( () => String )
    async changeOrganizerPassword( @Arg('token') token: string ) {
        let organizer = await Utils.getOrganizerFromJsWebToken(token);

        let passwordChange = await models.OrganizerPasswordChange.create({
            organizer
        }).save();

        let link_to_open = `${Utils.getCravingsWebUrl()}/change-password/org/${
            jwt.sign(
                {
                    ...await Utils.generateJsWebToken(organizer.id),
                    type: Utils.LOGIN_TOKEN_TYPE.ORGANIZER,
                    pwc: passwordChange.id
                },
                Utils.SECRET_KEY,
                { expiresIn: 10 * 60 } // Expires in 10 minutes
            )
        }`;

        let sentSuccessfully = await Utils.Mailer.sendPasswordChangeEmail({ link_to_open, email: organizer.email, username: organizer.orgName });

        if ( !sentSuccessfully ) await passwordChange.remove(); // We don't want to overload database creating unclose password changes

        return sentSuccessfully ? "Password change email sent successfully" : "Problem sending password change email";
    }

    @Query( () => String )
    async verifyOrganizerPasswordChangeToken( @Arg('token') token: string ) {
        let pwc = await Utils.verifyOrgPasswordChangeToken(token);

        if ( pwc.tokenUsed ) return "Token is not valid";

        return "Token is valid"
    }

    @Query( () => String )
    async confirmOrgPasswordChange( @Arg('token') token: string, @Arg('newPassword') newPassword: string, @Arg('confirmNewPassword') confirmNewPassword: string ) {
        if ( newPassword.length < 1 || confirmNewPassword.length < 1 ) return new Utils.CustomError("Can't change your password");

        if ( newPassword !== confirmNewPassword ) return new Utils.CustomError("Can't change your password");

        let pwc = await Utils.verifyOrgPasswordChangeToken(token);

        if ( pwc.tokenUsed ) return new Utils.CustomError("Can't change password");

        let org = pwc.organizer;

        org.password = await bcrypt.hash(newPassword, 12);

        pwc.tokenUsed = true;

        await pwc.save();
        await org.save();
    }

    // TODO: FIX THIS
    /*
    @Query( () => models.FoodTruckPageDetails )
    async userGetOrganizerPageDetails( @Arg('token') token: string, @Arg('truckId') truckId: string ) {
        let user = await Utils.getUserFromJsWebToken(token);

        let foodTruck = await models.Organizers.createQueryBuilder("ft")
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


        let foodTruckFood = await models.Organizers.createQueryBuilder('ftf')
        .select(`
            ftf.id, ftf.foodName as name, ftf.profilePicture, ftf.calories, ftf.cost, ftf.description, 
            "${user.id}" is uff.userId as hearted
        `)
        .leftJoin("user_favorite_food", "uff", `uff.foodTruckFoodId = ftf.id and uff.userId is "${user.id}"`)
        .getRawMany() as ( { id: string, name: string, profilePicture: string, cost: number, calories: number, description: string, hearted: boolean }[] | null )

        let foodTruckRating = await models.Organizers.createQueryBuilder('ftr')
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
    }*/
}
