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
    async OrganizerLogIn( @Arg("username") orgName: string, @Arg("password") password: string ) {
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

    @Query( returns => models.Organizers )
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
                    let prices: ( number | null )[] = [];

                    try {
                        prices = (await stripeHandler.getEventTicketPrices(e.productId, organizer!.stripeConnectId ))?.data.map(v => v.unit_amount);
                    }catch(e) { prices = [0]; }
    
                    let maxPrice, minPrice = 0;
    
                    if (prices && prices.length > 0) {
                        maxPrice = Math.max(...prices as number[]) / 100;
                        minPrice = Math.min(...prices as number[]) / 100;
                    }
    
                    return {
                        id: e.id,
                        name: e.title,
                        description: e.description,
                        banner: e.banner,
                        costRange: `$${minPrice}-$${maxPrice}`,
                        eventDate: e.eventDate,
                        location: {
                            latitude: e.latitude,
                            longitude: e.longitude,
                            location: e.location
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

    @Mutation( () =>  models.Events )
    async createEvent( @Arg('token') token: string, @Arg('title') title: string, @Arg('description') description: string ) {
        let org = await Utils.getOrganizerFromJsWebToken(token);

        let event = await models.Events.create({
            title,
            description,
            banner: "",
            organizer: { id: org.id }
        }).save();

        let stripeEvent = await stripeHandler.createEvent(org.stripeConnectId, org.id, event.id, title );

        event.productId = stripeEvent.id;

        await event.save();

        return event;
    }

    @Mutation( () => String )
    async modifyEvent( @Arg('token') token: string, @Arg('args', () =>  models.ModifyEventInputType ) args: models.ModifyEventInputType ) {
        let organizer = await Utils.getOrganizerFromJsWebToken( token );

        let event = await models.Events.findOne({ where: { id: args.id, organizer: { id: organizer.id } } });

        if ( !event ) return new Utils.CustomError("Event does not exist");

        if ( args.title ) event.title = args.title;

        if ( args.description ) event.description = args.description;

        if ( args.eventDate ) event.eventDate = args.eventDate;

        if ( args.endDate ) event.endEventDate = args.endDate;

        if ( args.visible ) event.visible = args.visible;

        if ( args.location ) {
            let loc = await Utils.googleMapsService.getLatitudeLongitude(args.location);

            event.location = args.location;
            event.latitude = loc.lat;
            event.longitude = loc.lng;
        }

        if ( args.banner ) event.banner = args.banner;

        await event.save();

        return "Modified Properly";
    }

    @Mutation( () => String )
    async createEventTicket( @Arg('token') token: string, @Arg('eventId') eventId: string, @Arg('title') title: string, @Arg('amount') amount: number, @Arg('currency', { nullable: true, defaultValue: 'usd' }) currency: string, @Arg('description', { nullable: true }) description: string ) {
        let org = await Utils.getOrganizerFromJsWebToken( token );

        let event = await models.Events.findOne({ where: { id: eventId, organizer: { id: org.id } }});

        if ( !event ) return new Utils.CustomError("Event does not exist");

        let eventTicket = await models.EventTickets.create({
            title,
            description,
            event,
            amount
        }).save();

        try {
            let stripeTicket = await stripeHandler.createEventPrice( org.stripeConnectId, org.id, event.id, event.productId, amount, currency );
            
            eventTicket.priceId = stripeTicket.id;

            await eventTicket.save();
        }catch(err) {
            await eventTicket.remove(); // want to self clean database

            return new Utils.CustomError("Problem creating event ticket")
        }

        return "Event Ticket created successfully";
    }

    @Mutation( () => String ) 
    async modifyEventTicketPrice( @Arg('token') token: string, @Arg('eventId') eventId: string, @Arg('args', () => models.ModifyEventTicketPriceInputType ) args: models.ModifyEventTicketPriceInputType ) {
        let org = await Utils.getOrganizerFromJsWebToken( token );

        let event = await models.Events.findOne({ where: { id: eventId, organizer: { id: org.id } }});

        if ( !event ) return new Utils.CustomError("Event does not exist");

        let eventTicket = await models.EventTickets.findOne({ where: { id: args.id, event: { id: eventId }} });

        if ( !eventTicket ) return new Utils.CustomError("Problem changing event ticket");

        try {
            let newStripeTicket = await stripeHandler.modifyEventPrice( org.stripeConnectId, org.id, eventId, event.productId, eventTicket.priceId, args.amount, args.currency );

            eventTicket.priceId = newStripeTicket.id;
            eventTicket.amount = args.amount;
            await eventTicket.save();
        }catch( err ) {
            console.log( err );
            return new Utils.CustomError("Problem modifying event ticket");
        }

        return "Event Ticket Price modified successfully";
    }

    @Mutation( () => String )
    async modifyEventTicket( @Arg('token') token: string, @Arg('eventId') eventId: string, @Arg('args', () => models.ModifyEventTicketInputType ) args: models.ModifyEventTicketInputType ) {
        let org = await Utils.getOrganizerFromJsWebToken( token );

        let event = await models.Events.findOne({ where: { id: eventId, organizer: { id: org.id } }});

        if ( !event ) return new Utils.CustomError("Event does not exist");

        let eventTicket = await models.EventTickets.findOne({ where: { id: args.id, event: { id: eventId }} });

        if ( !eventTicket ) return new Utils.CustomError("Problem changing event ticket");

        if ( args.title ) event.title = args.title;

        if ( args.description ) event.description = args.description;

        await event.save();

        return "Event Ticket updated successfully";
    }
}
