import * as models from '../../../models';

import { stripe } from '../stripe';
import { PAYMENT_INTENT_TYPE } from '../ticketClientSecerets';

type Price = { amount: number, quantity: number, id: string };

export const buyTicketSuccedded = async ( id: string, metadata: { customer: string | null, type: PAYMENT_INTENT_TYPE, eventId: string, priceList: string }, name?: string, email?: string ) => {
    let event = await models.Events.findOne({ where: { id: metadata.eventId } });

    if ( !event ) return { status: 500, message: 'Event not found' };

    let user: models.Users | null = null;

    if ( metadata.customer ) {
        try {
            user = await models.Users.findOne({ where: { id: metadata.customer } });

            if ( !user ) return { status: 500, message: 'User not found' };
        }catch( e ) { console.log( e ); }
    }

    let priceList: Price[] = [];

    try {
        priceList = JSON.parse( metadata.priceList ) as Price[];
    }catch( e ) { console.log( e );  return { status: 500, message: 'Price List Not Properly Formatted' } }

    for ( let i = 0; i < priceList.length; i++ ) {
        let price = priceList[ i ];

        let eventTicket = await models.EventTickets.findOne({ where: { priceId: price.id }});

        if ( !eventTicket ) return { status: 500, message: 'Cannot find event ticket' };

        let ticketBuy = await models.EventTicketBuys.create({
            type: metadata.customer ? 'user' : 'guest',
            name: name || 'UNKNOWN USER',
            email: email || 'UNKNOWN EMAIL',
            quantity: price.quantity,
            checkIn: false,
            stripeTransactionId: id,
            user: user || undefined,
            eventTicket
        }).save()
    }

    return { status: 200, message: 'Event Tickets Created Successfully' };
}
