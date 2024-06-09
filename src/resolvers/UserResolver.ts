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
                throw new Utils.CustomError("Probjectlem Creating Customer Account") 
            };

            return jwt.sign(
                {
                    ...await Utils.generateJsWebToken(user.id),
                    type: Utils.LOGIN_TOKEN_TYPE.USER
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
                        type: Utils.LOGIN_TOKEN_TYPE.USER
                    },
                    Utils.SECRET_KEY,
                    { expiresIn: "2w" }
                );
            }
        }

        throw new Utils.CustomError("Invalid credentials. Please try again")
    }

    @Query( returns => String )
    async relogin( @Arg('token', { nullable: true, defaultValue: '' }) token: string ) {
        return Utils.getRegenToken( token );
    }

    @Query( () => models.UserProfileInformation ) 
    async getUserProfileInformation( @Arg('token') token: string ) {
        let user = await Utils.getUserFromJsWebToken(token, [ 'eventTickets.cart']);

        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            phoneNumber: user.phoneNumber,
            email: user.email,
            profilePicture: user.profilePicture,
            followers: await models.UserFollowers.count({ where: { following: { id: user.id } } }),
            following: await models.UserFollowers.count({ where: { user: { id: user.id } } }),
            events: (
                await Promise.all(
                    [ ... new Set(
                        (
                            await models.EventTicketBuys.find({ where: { user: { id: user.id } }, relations: [ 'cart' ] })
                        ).map( et => et.cart.eventId )
                    )]
                )
            ).length,
            searchMilesRadius: user.searchMilesRadius
        }
    }

    @Mutation( () => String )
    async modifyUserProfileInformation( @Arg('token') token: string, @Arg('arg', () => models.UserProfileInformationInput ) arg : models.UserProfileInformationInput ) {
        let user = await Utils.getUserFromJsWebToken(token);

        if ( arg.firstName ) user.firstName = arg.firstName
        if ( arg.lastName ) user.lastName = arg.lastName
        if ( arg.username ) user.username = arg.username
        if ( arg.phoneNumber ) user.phoneNumber = arg.phoneNumber
        if ( arg.email ) user.email = arg.email

        await user.save();

        return "Modified Properly";
    }

    @Mutation( () => String )
    async changeUserPassword( @Arg("token") token: string ) {
        let user = await Utils.getUserFromJsWebToken(token);

        let passwordChange = await models.UserPasswordChange.create({
            user
        }).save();

        let link_to_open = `${Utils.getCravingsWebUrl()}/change-password/user/${
            jwt.sign(
                {
                    ...await Utils.generateJsWebToken(user.id),
                    type: Utils.LOGIN_TOKEN_TYPE.USER,
                    command: "change-password",
                    pwc: passwordChange.id
                }, 
                Utils.SECRET_KEY, 
                { expiresIn: 10 * 60 } // Expires in 10 minutes
            )
        }`;

        let sentSuccessfully = await Utils.Mailer.sendPasswordChangeEmail({ link_to_open, email: user.email, username: user.username });

        if ( !sentSuccessfully ) await passwordChange.remove(); // We don't want to overload database creating unclose password changes

        return sentSuccessfully ? "Password change email sent successfully" : "Probjectlem sending password change email";
    }

    @Query( () => String )
    async verifyUserPasswordChangeToken( @Arg('token') token: string ) {
        let pwc = await Utils.verifyUserPasswordChangeToken(token);

        if ( pwc.tokenUsed ) return "Token is not valid";

        return "Token is valid";
    }

    @Mutation( () => String )
    async confirmUserPasswordChange( @Arg('token') token: string, @Arg('newPassword') newPassword: string, @Arg('confirmNewPassword') confirmNewPassword: string ) {
        
        if ( newPassword.length < 1 || confirmNewPassword.length < 1 ) return new Utils.CustomError("Can't change your password");

        if ( newPassword !== confirmNewPassword ) return new Utils.CustomError("Can't change your password");
        
        let pwc = await Utils.verifyUserPasswordChangeToken(token);

        if ( pwc.tokenUsed ) return new Utils.CustomError("Can't change password");

        let user = pwc.user;

        user.password = await bcrypt.hash(newPassword, 12);

        pwc.tokenUsed = true;

        await pwc.save();
        await user.save();

        return "Successfully changed your password";
    }

    @Mutation( () => String )
    async followUser( @Arg('token') token: string, @Arg('userId') userId: string ) {
        let user = await Utils.getUserFromJsWebToken( token );

        let toFollow = await models.Users.findOne({ where: { id: userId }});

        if ( !toFollow ) return new Utils.CustomError('User does not exist')

        let alreadyFollowing = await models.UserFollowers.findOne({ where: { user: { id: user.id }, following: { id: toFollow.id } }})
    
        if ( alreadyFollowing ) return alreadyFollowing.id;

        return (
            await models.UserFollowers.create({
                user,
                following: toFollow
            }).save()
        ).id
    }

    @Mutation( () => String )
    async unFollowUser( @Arg('token') token: string, @Arg('userId') userId: string ) {
        let user = await Utils.getUserFromJsWebToken( token );

        let alreadyFollowing = await models.UserFollowers.findOne({ where: { user: { id: user.id }, following: { id: userId } } });

        if ( !alreadyFollowing ) return 'Not following';

        await alreadyFollowing.remove();

        return 'No Longer Following';
    }

    @Mutation( () => String )
    async followOrganizer( @Arg('token') token: string, @Arg('organizerId') organizerId: string ) {
        let user = await Utils.getUserFromJsWebToken( token );

        let organizer = await models.Organizers.findOne({ where: { id: organizerId }});

        if ( !organizer ) return new Utils.CustomError('Organizer does not exist');

        let alreadyFollowing = await models.OrganizersFollowers.findOne({ where: { user: { id: user.id }, organizer: { id: organizer.id } } });

        if ( alreadyFollowing ) return alreadyFollowing.id;

        return (
            await models.OrganizersFollowers.create({
                user,
                organizer
            }).save()
        ).id;
    }

    @Mutation( () => String )
    async unFollowOrganizer( @Arg('token') token: string, @Arg('organizerId') userId: string ) {
        let user = await Utils.getUserFromJsWebToken( token );

        let alreadyFollowing = await models.OrganizersFollowers.findOne({ where: { user: { id: user.id }, organizer: { id: userId } } });

        if ( !alreadyFollowing ) return 'Not following';

        await alreadyFollowing.remove();

        return 'No Longer Following';
    }
    
    @Query( () => [ models.EventRecommendationResponse ])
    async getFriendsFollowingEvents( @Arg('token') token: string, @Arg('limit', { defaultValue: 50 }) limit: number ) {
        let user = await Utils.getUserFromJsWebToken( token );

        let events: models.EventRecommendationDatabaseResponse[] = await models.Events.query(`
            select
            e.id, e.title, e.description, e.banner, e.productId, e.createdAt, e.updatedAt, e.organizerId, e.location, e.latitude as eLat, e.longitude as eLong, e.eventDate,
            o.id as orgId, o.stripeConnectId as orgStripeConnectId, o.orgName, o.profilePicture as orgProfilePicture,
            ${ user ? "u.latitude as uLat, u.longitude as uLong," : "" }
            COUNT(etb.id) AS ticketSold
            from events e
            left join event_tickets et on e.id = et.eventId
            left join event_ticket_buys etb on et.id = etb.eventTicketId
            left join organizers o on e.organizerId = o.id
            left join users u on u.id = ${user.id}
            left join organizers_followers oF on oF.userId = u.id
            where e.visible = TRUE and o.id = oF.followingId
            group by e.id 
            order by DATE(e.eventDate) DESC, ticketSold DESC
            limit ${limit}
        `);

        return (await Promise.all(
            events.map(async (val) => {
                let miles = Math.round(Utils.getMiles({ longitude: val.uLong || 0, latitude: val.uLong || 0 }, { longitude: val.eLong || 0, latitude: val.eLat || 0 }));

                let prices: ( number | null )[] = [];

                try {
                    prices = (await stripeHandler.getEventTicketPrices(val.productId, val.orgStripeConnectId ))?.data.map(v => v.unit_amount);
                }catch(e) { prices = [0]; }

                let maxPrice, minPrice = 0;

                if (prices && prices.length > 0) {
                    maxPrice = Math.max(...prices as number[]) / 100;
                    minPrice = Math.min(...prices as number[]) / 100;
                }

                return {
                    id: val.id,
                    title: val.title,
                    description: val.description,
                    banner: val.banner,
                    costRange: prices.length > 1 ? `$${minPrice}-$${maxPrice}` : `$${minPrice}`,
                    location: {
                        latitude: val.eLat,
                        longitude: val.eLong,
                        location: val.location
                    },
                    eventDate: new Date( val.eventDate ),
                    miles: Utils.shortenNumericString(miles),
                    timeToDestination: Utils.shortenMinutesToString(miles * 2), // To minitus per mile
                    ticketSold: val.ticketSold || 0,
                    organizer: {
                        id: val.orgId,
                        name: val.orgName,
                        profilePicture: val.orgProfilePicture
                    },
                    milesNum: miles
                };
            })
        )).filter( val => ( val.milesNum <= user.searchMilesRadius + Utils.milesFilterLeway )|| val.id !== null );
    }

    @Query( () => [ models.EventRecommendationResponse ])
    async getOrgFollowingEvents( @Arg('token') token: string, @Arg('limit', { defaultValue: 50 }) limit: number ) {
        let user = await Utils.getUserFromJsWebToken( token );

        let events: models.EventRecommendationDatabaseResponse[] = await models.Events.query(`
            select
            e.id, e.title, e.description, e.banner, e.productId, e.createdAt, e.updatedAt, e.organizerId, e.location, e.latitude as eLat, e.longitude as eLong, e.eventDate,
            o.id as orgId, o.stripeConnectId as orgStripeConnectId, o.orgName, o.profilePicture as orgProfilePicture,
            ${ user ? "u.latitude as uLat, u.longitude as uLong," : "" }
            COUNT(etb.id) AS ticketSold
            from events e
            left join event_tickets et on e.id = et.eventId
            left join event_ticket_buys etb on et.id = etb.eventTicketId
            left join organizers o on e.organizerId = o.id
            left join users u on u.id = ${user.id}
            left join organizers_followers oF on oF.userId = u.id
            where e.visible = TRUE and o.id = oF.followingId
            group by e.id 
            order by DATE(e.eventDate) DESC, ticketSold DESC
            limit ${limit}
        `);

        return (await Promise.all(
            events.map(async (val) => {
                let miles = Math.round(Utils.getMiles({ longitude: val.uLong || 0, latitude: val.uLong || 0 }, { longitude: val.eLong || 0, latitude: val.eLat || 0 }));

                let prices: ( number | null )[] = [];

                try {
                    prices = (await stripeHandler.getEventTicketPrices(val.productId, val.orgStripeConnectId ))?.data.map(v => v.unit_amount);
                }catch(e) { prices = [0]; }

                let maxPrice, minPrice = 0;

                if (prices && prices.length > 0) {
                    maxPrice = Math.max(...prices as number[]) / 100;
                    minPrice = Math.min(...prices as number[]) / 100;
                }

                return {
                    id: val.id,
                    title: val.title,
                    description: val.description,
                    banner: val.banner,
                    costRange: prices.length > 1 ? `$${minPrice}-$${maxPrice}` : `$${minPrice}`,
                    location: {
                        latitude: val.eLat,
                        longitude: val.eLong,
                        location: val.location
                    },
                    eventDate: new Date( val.eventDate ),
                    miles: Utils.shortenNumericString(miles),
                    timeToDestination: Utils.shortenMinutesToString(miles * 2), // To minitus per mile
                    ticketSold: val.ticketSold || 0,
                    organizer: {
                        id: val.orgId,
                        name: val.orgName,
                        profilePicture: val.orgProfilePicture
                    },
                    milesNum: miles
                };
            })
        )).filter( val => ( val.milesNum <= user.searchMilesRadius + Utils.milesFilterLeway )|| val.id !== null );
    }

    @Query( () => [ models.UsersFollowing ])
    async usersOrgFollowing( @Arg('token') token: string ) {
        let user = await Utils.getUserFromJsWebToken(token);

        let orgFollowed = await models.OrganizersFollowers.find({ where: { user: { id: user.id } }, relations: [ 'organizer' ] });

        return orgFollowed.map( oF => ({
            id: oF.id,
            objectId: oF.organizer.id,
            objectPic: oF.organizer.profilePicture,
            objectName: oF.organizer.orgName,
            type: 'org'
        }))
    }

    @Query( () => [ models.UsersFollowing ])
    async usersFollowing( @Arg('token') token : string ) {
        let user = await Utils.getUserFromJsWebToken(token);

        let userFollowed = await models.UserFollowers.find({ where: { user: { id: user.id } }, relations: ['following'] });

        return userFollowed.map( uF => ({
            id: uF.id,
            objectId: uF.following.id,
            objectPic: uF.following.profilePicture,
            objectName: uF.following.username,
            type: 'user'
        }))
    }

    @Mutation( () => models.UserDeleteOrgFollowing )
    async userDeleteOrgFollowing( @Arg('token') token: string, @Arg('orgId') orgId: string  ) {
        let user = await Utils.getUserFromJsWebToken(token);

        let orgToDelete = await models.OrganizersFollowers.findOne({ where: { id: orgId }});

        if ( !orgToDelete ) return new Utils.CustomError(`Organizer following id does not exist`);

        orgToDelete = await orgToDelete.remove();

        return {
            deletedOrgFollowing: {
                id: orgToDelete.id,
                objectId: orgToDelete.organizer.id,
                objectPic: orgToDelete.organizer.profilePicture,
                objectName: orgToDelete.organizer.orgName,
                type: 'org'
            },
            orgFollowing: ( await models.OrganizersFollowers.find({ where: { user: { id: user.id } }, relations: [ 'organizer' ] }) ).map( oF => ({
                id: oF.id,
                objectId: oF.organizer.id,
                objectPic: oF.organizer.profilePicture,
                objectName: oF.organizer.orgName,
                type: 'org'
            }))
        }
    }

    @Mutation( () => models.UserDeleteUsersFollowing )
    async userDeleteUserFollowing( @Arg('token') token: string, @Arg('userId') userId: string ) {
        let user = await Utils.getUserFromJsWebToken(token);

        let userToDelete = await models.UserFollowers.findOne({ where: { id: userId } });

        if ( !userToDelete ) return new Utils.CustomError(`User following id does not exist`);

        userToDelete = await userToDelete.remove();

        return {
            deletedUserFollowing: {
                id: userToDelete.id,
                objectId: userToDelete.following.id,
                objectPic: userToDelete.following.profilePicture,
                objectName: userToDelete.following.username,
                type: 'user'
            },
            userFollowing: ( await models.UserFollowers.find({ where: { user: { id: user.id } }, relations: ['following'] }) ).map( uF => ({
                id: uF.id,
                objectId: uF.following.id,
                objectPic: uF.following.profilePicture,
                objectName: uF.following.username,
                type: 'user'
            }))
        }
    }

}
