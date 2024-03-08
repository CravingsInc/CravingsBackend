import { Resolver, Mutation, Arg, Query } from "type-graphql";

import * as models from "../models";

import { Utils, stripeHandler } from "../utils";

@Resolver()
export class EventResolver {

    @Query( () => [ models.EventRecommendationResponse ] )
    async getPopularOrganizersEvents( @Arg('limit') limit: number, @Arg('latitude', { nullable: true, defaultValue: 42.3314 } ) latitude: number, @Arg('longitude', { nullable: true, defaultValue: 83.0458 } ) longitude: number, @Arg('token', { nullable: true } ) token?: string ) {
        let user: models.Users | null = null;

        if ( token ) {
            try {
                user = await Utils.getUserFromJsWebToken( token );
            }catch ( e ) { console.log( e ); }
        }

        let events: ( { orgFollowers: number } & models.EventRecommendationDatabaseResponse )[] = [];

        try {
            let query = models.Events.createQueryBuilder('e') 
            .select(`
                e.id, e.title, e.description, e.banner, e.productId, e.createdAt, e.updatedAt, e.organizerId, e.location, e.latitude as eLat, e.longitude as eLong, e.eventDate,
                o.id as orgId, o.stripeConnectid as orgStripeConnectId, o.orgName, o.profilePicture as orgProfilePicture,
                ${ user ? "u.latitude as uLat, u.longitude as uLong," : "" }
                count(etb.id) as ticketSold,
                count(oF.id) as orgFollowers
            `)
            .leftJoin('event_tickets', 'et', 'e.id = et.eventId')
            .leftJoin('event_ticket_buys', 'etb', 'et.id = etb.eventTicketId')
            .leftJoin('organizers', 'o', 'e.organizerId = o.id')
            .leftJoin('organizers_followers', 'oF', 'o.id = oF.organizerId')

            if ( user ) query = query.leftJoin('users', 'u', `u.id = ${user.id}`)
        
            query.where(
                user ? `
                    ( u.searchMilesRadius * u.searchMilesRadius ) - (
                        (
                            ( u.longitude - e.longitude ) * ( u.longitude - e.longitude )
                        ) + 
                        (
                            ( u.latitude - e.latitude ) * ( u.latitude - e.latitude )
                        )
                    ) >= 0
                ` : 
                    (
                        `
                            ( 12 * 12 ) - (
                                (
                                    ( ${longitude} - e.longitude ) * ( ${longitude} - e.longitude )
                                ) + 
                                (
                                    ( ${latitude} - e.latitude ) * ( ${latitude} - e.latitude )
                                )
                            ) >= 0
                        `
                    )
            )
            .andWhere("e.visible = true")
            .orderBy('orgFollowers', 'DESC')
            .limit(limit);

            events = await query.getRawMany()
        }catch ( e ) { console.log(e); }

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
                    costRange: `$${minPrice}-$${maxPrice}`,
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
        )).filter( val => 
            ( val.milesNum <= ( user ? user.searchMilesRadius : 20 ) + Utils.milesFilterLeway )
            || val.id !== null
        );
    }


    @Query( () => [ models.EventRecommendationResponse ] )
    async getPopularEvents( @Arg('limit') limit: number, @Arg('latitude', { nullable: true, defaultValue: 42.3314 } ) latitude: number, @Arg('longitude', { nullable: true, defaultValue: 83.0458 } ) longitude: number, @Arg('token', { nullable: true } ) token?: string ) {
        let user: models.Users | null = null;

        if ( token ) {
            try {
                user = await Utils.getUserFromJsWebToken( token );
            }catch ( e ) { console.log( e ); }
        }

        let events: models.EventRecommendationDatabaseResponse[] = [];

        try {
            let query = models.Events.createQueryBuilder('e') 
            .select(`
                e.id, e.title, e.description, e.banner, e.productId, e.createdAt, e.updatedAt, e.organizerId, e.location, e.latitude as eLat, e.longitude as eLong, e.eventDate,
                o.id as orgId, o.stripeConnectId as orgStripeConnectId, o.orgName, o.profilePicture as orgProfilePicture,
                ${ user ? "u.latitude as uLat, u.longitude as uLong," : "" }
                count(etb.id) as ticketSold
            `)
            .leftJoin('event_tickets', 'et', 'e.id = et.eventId')
            .leftJoin('event_ticket_buys', 'etb', 'et.id = etb.eventTicketId')
            .leftJoin('organizers', 'o', 'e.organizerId = o.id')

            if ( user ) query = query.leftJoin('users', 'u', `u.id = ${user.id}`)
        
            query.where(
                user ? `
                    ( u.searchMilesRadius * u.searchMilesRadius ) - (
                        (
                            ( u.longitude - e.longitude ) * ( u.longitude - e.longitude )
                        ) + 
                        (
                            ( u.latitude - e.latitude ) * ( u.latitude - e.latitude )
                        )
                    ) >= 0
                ` : 
                    (
                        `
                            ( 12 * 12 ) - (
                                (
                                    ( ${longitude} - e.longitude ) * ( ${longitude} - e.longitude )
                                ) + 
                                (
                                    ( ${latitude} - e.latitude ) * ( ${latitude} - e.latitude )
                                )
                            ) >= 0
                        `
                    )
            )
            .andWhere("e.visible = true")
            .orderBy('ticketSold', 'DESC')
            .limit(limit);

            events = await query.getRawMany()
        }catch ( e ) { console.log(e); }

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
                    costRange: `$${minPrice}-$${maxPrice}`,
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
        )).filter( val => 
            ( val.milesNum <= ( user ? user.searchMilesRadius : 20 ) + Utils.milesFilterLeway )
            || val.id !== null
        );
    }

    @Query( () => [ models.EventRecommendationResponse ] )
    async getUpComingEvents( @Arg('limit') limit: number, @Arg('latitude', { nullable: true, defaultValue: 42.3314 } ) latitude: number, @Arg('longitude', { nullable: true, defaultValue: 83.0458 } ) longitude: number, @Arg('token', { nullable: true } ) token?: string ) {

        let user: models.Users | null = null;

        if ( token ) {
            try {
                user = await Utils.getUserFromJsWebToken( token );
            }catch( e ) { console.log( e) }
        }

        const currentDateQuery = await models.Events.query(`select CURRENT_DATE`);
        const currentDate = currentDateQuery[0].CURRENT_DATE;

        let events: models.EventRecommendationDatabaseResponse[] = [];

        try {
            let query = models.Events.createQueryBuilder('e') 
            .select(`
                e.id, e.title, e.description, e.banner, e.productId, e.createdAt, e.updatedAt, e.organizerId, e.location, e.latitude as eLat, e.longitude as eLong, e.eventDate,
                o.id as orgId, o.stripeConnectId as orgStripeConnectId, o.orgName, o.profilePicture as orgProfilePicture,
                ${ user ? "u.latitude as uLat, u.longitude as uLong," : "" }
                count(etb.id) as ticketSold
            `)
            .leftJoin('event_tickets', 'et', 'e.id = et.eventId')
            .leftJoin('event_ticket_buys', 'etb', 'et.id = etb.eventTicketId')
            .leftJoin('organizers', 'o', 'e.organizerId = o.id')

            if ( user ) query = query.leftJoin('users', 'u', `u.id = ${user.id}`)
        
            query.where(
                user ? `
                    ( u.searchMilesRadius * u.searchMilesRadius ) - (
                        (
                            ( u.longitude - e.longitude ) * ( u.longitude - e.longitude )
                        ) + 
                        (
                            ( u.latitude - e.latitude ) * ( u.latitude - e.latitude )
                        )
                    ) >= 0
                ` : 
                    (
                        `
                            ( 12 * 12 ) - (
                                (
                                    ( ${longitude} - e.longitude ) * ( ${longitude} - e.longitude )
                                ) + 
                                (
                                    ( ${latitude} - e.latitude ) * ( ${latitude} - e.latitude )
                                )
                            ) >= 0
                        `
                    )
            )
            .andWhere("e.visible = true")
            .orderBy('ticketSold', 'DESC')
            .addOrderBy(`ABS( e.eventDate - CAST( '${currentDate}' as Date ) )`)
            .limit(limit);

            events = await query.getRawMany()
        }catch ( e ) { console.log(e); }

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
                    costRange: `$${minPrice}-$${maxPrice}`,
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
        )).filter( val => 
            ( val.milesNum <= ( user ? user.searchMilesRadius : 20 ) + Utils.milesFilterLeway )
            || val.id !== null
        );
    }

    @Query( () => models.EventsPage )
    async getEventsPage( @Arg('eventId') eventId: string, @Arg("userToken", { nullable: true }) userToken?: string ) {
        let user = userToken ? await Utils.getUserFromJsWebToken(userToken) : null;

        let event = await models.Events.findOne({ where: { id: eventId }, relations: [ 'organizer', 'prices' ] });

        if ( !event ) return new Utils.CustomError("Invalid Event. Please try again.");

        await models.EventsPageVisit.create({
            guest: user == null,
            user,
            event
        }).save();

        let prices: ( number | null )[] = [];

        try {
            prices = (await stripeHandler.getEventTicketPrices(event.productId, event.organizer.stripeConnectId ))?.data.map(v => v.unit_amount);
        }catch(e) { prices = [0]; console.log(e); }

        let max, min = 0;

        if ( prices && prices.length > 0 ) {
            max = Math.max(...prices as number[] ) / 100;
            min = Math.min(...prices as number[] ) / 100;
        }

        return {
            id: event.id,
            name: event.title,
            description: event.description,
            banner: event.banner,
            eventDate: new Date( event.eventDate ),
            costRange: `$${min}-$${max}`,
            ticketSold: await models.EventTicketBuys.countBy({ eventTicket: { event: { id: event.id } } }),
            location: {
                latitude: event.latitude,
                longitude: event.longitude,
                location: event.location
            },
            organizer: {
                id: event.organizer.id,
                name: event.organizer.orgName,
                profilePicture: event.organizer.profilePicture,
                events: await models.Events.countBy({ organizer: { id: event.organizer.id } }),
                followers: await models.OrganizersFollowers.countBy({ organizer: { id: event.organizer.id } })
            },
            prices: event.prices.map( prices => ({ id: prices.priceId, title: prices.title, description: prices.description, amount: prices.amount }))
        }
    }

    @Query( () => models.EventTicketBuys )
    async getTicketBuy( @Arg('id') id: string ) {
        return await models.EventTicketBuys.findOne({ where: { id: id }, relations: ['user'] });
    }

    @Mutation( () => String ) 
    async confirmTicketCheckIn( @Arg('id') id: string ) {
        let ticket = await models.EventTicketBuys.findOne({ where: { id: id } });

        if ( !ticket ) return new Utils.CustomError("Ticket not found.");

        ticket.checkIn = true;

        await ticket.save();

        return "Checked in successfully.";
    }

    @Mutation( () => String )
    async createTicketSellClientSecret( @Arg('eventId') eventId: string, @Arg('userToken', { nullable: true } ) userToken?: string ) {
        let user: models.Users | null = null;

        try {
            user = await Utils.getUserFromJsWebToken( userToken || "" );
        }catch (e) { console.log(e); }

        let event = await models.Events.findOne({ where: { id: eventId }, relations: [ 'organizer' ] });

        if ( !event ) return new Utils.CustomError("Event not found.");

        if ( !event.visible || !event.organizer.stripeAccountVerified ) return new Utils.CustomError("Event not found.");

        return ( await stripeHandler.createPaymentIntent( event.organizer.stripeConnectId, event.id ) ).client_secret
    }

    @Mutation( ( ) => String )
    async updateTicketSellClientSecret( @Arg('id') id: string, @Arg('eventId') eventId: string, @Arg('prices', () => [models.TicketBuyClientSecretUpdate], { defaultValue: [] } ) prices: models.TicketBuyClientSecretUpdate[] ) {
        const event = await models.Events.findOne({ where: { id : eventId }, relations: [ 'organizer' ] });

        if ( !event ) return new Utils.CustomError("Event not found.");

        if ( !event.visible || !event.organizer.stripeAccountVerified ) return new Utils.CustomError("Event not found.");
        
        const intent = await stripeHandler.updatePaymentIntent( id, prices, event.organizer.stripeConnectId );

        return intent.status;
    }
}
