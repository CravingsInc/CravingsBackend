import { Resolver, Mutation, Arg, Query } from "type-graphql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import * as models from "../models";

import { Utils, stripeHandler } from "../utils";

@Resolver()
export class EventResolver {

    @Query( () => models.EventRecommendationResponse )
    async getEventsPage( @Arg('eventId') eventId: string, @Arg("userToken", { nullable: true }) userToken?: string ) {
        let user = userToken ? await Utils.getUserFromJsWebToken(userToken) : null;

        let event = await models.Events.findOne({ where: { id: eventId }, relations: [ 'organizer', 'prices' ] });

        if ( !event ) return new Utils.CustomError("Invalid Event. Please try again.");

        await models.EventsPageVisit.create({
            guest: user == null,
            user,
            event
        }).save();

        let prices = ( await stripeHandler.getEventTicketPrices(event.productId) )?.data.map( v => v.unit_amount );

        let max, min = 0;

        if ( prices && prices.length > 0 ) {
            max = Math.max(...prices as number[] ) * 100;
            min = Math.min(...prices as number[] ) * 100;
        }
        
        return {
            id: event.id,
            name: event.title,
            description: event.description,
            banner: event.banner,
            costRange: `$${min}-${max}`,
            location: {
                lat: event.latitude,
                long: event.longitude
            },
            organizer: {
                id: event.organizer.id,
                name: event.organizer.orgName,
                profilePicture: event.organizer.profilePicture
            },
            prices: event.prices.map( prices => ({ id: prices.id, title: prices.title, description: prices.description, amount: prices.amount }))
        }
    }
}
