import migrationData from '../migration.json';
import * as models from '../../models';
import { stripeHandler } from '../../utils';
import { CreateOrganizerResponse } from '../types';

export const createEventTicket = async ( price: ( typeof migrationData.events[number] )['tickets'][number], eventSaved: models.Events, org: CreateOrganizerResponse ) => {
    let ticket = await models.EventTickets.create({
        title: price.title,
        description: price.description,
        event: { id: eventSaved.id },
        amount: price.amount,
        totalTicketAvailable: price.totalAvailable,
        currency: 'usd'
    }).save();

    try {
        let stripeTicket = await stripeHandler.createEventPrice( org.stripeAccount, org.id, eventSaved.id, eventSaved.productId, ticket.amount, "usd" );
        
        ticket.priceId = stripeTicket.id;

        console.log(`\n\t\t\t\tCreated event ticket: ${ticket.id}`);

        return await ticket.save();
    }catch(err) {
        await ticket.remove(); // want to self clean database
    }
}
