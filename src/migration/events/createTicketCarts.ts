import * as models from '../../models';
import migrationData from '../migration.json';
import { PAYMENT_INTENT_TYPE, stripe } from '../../utils/stripe';

export const createTicketCarts = async ( eventId: string, products: models.EventTickets[], stripeAccount: string, rangePerTicket: number = 1 ) => {
    const cart = await models.EventTicketCart.create({
        completed: false,
        eventId
    }).save();

    let priceList = await Promise.all( products.map( async ( price ) => ({
        amount: price.amount,
        quantity: Math.floor( rangePerTicket * price.totalTicketAvailable ),
        id: price.priceId
    })));

    const customer = Math.random() < 0.5 ? undefined : 
        await models.Users.findOne({ 
            where: {
                username: migrationData.users[ Math.floor( Math.random() * migrationData.users.length ) ].username
            }
        }) // Grab random customer

    
    const totalPrice = priceList.reduce( ( prev, curr ) => prev + ( ( curr.amount || 0 ) * curr.quantity ), 0 );

    if ( totalPrice >= 0.5 ) {

        try {
            let paymentIntent = await stripe.paymentIntents.create({
                amount:  ( totalPrice * 100 )  * 100,
                currency: "usd",
                customer: customer === null || customer === undefined ? undefined : customer.stripeCustomerId,
                setup_future_usage: customer === null || customer === undefined ? "on_session" : "off_session",
                payment_method: 'pm_card_mastercard',
                confirmation_method: 'automatic',
                transfer_data: {
                    destination: stripeAccount
                },
                application_fee_amount: ( totalPrice * 100 ) * 0.1,
        
                metadata: {
                    customer: customer === null || customer === undefined? null : customer.id,
                    type: PAYMENT_INTENT_TYPE.TICKET,
                    eventId,
                    cart: cart.id,
                    priceList: JSON.stringify( priceList )
                }
            });
        
            let confirmedPaymentIntent = await stripe.paymentIntents.confirm( paymentIntent.id );

            console.log( confirmedPaymentIntent )
    
            if ( confirmedPaymentIntent.status === "succeeded" ) {
                cart.stripeTransactionId = confirmedPaymentIntent.id;
                cart.completed = true;
            }else {
                await cart.remove();
                return;
            }
        }catch(e) {
            console.error( e );
            await cart.remove();
            return
        }
    }

    let name = migrationData.users[ Math.floor( Math.random() * migrationData.users.length ) ].username;
    let email = migrationData.users[ Math.floor( Math.random() * migrationData.users.length ) ].email;
        
    for ( let i = 0; i < priceList.length; i++ ) {
        let eventTicket = products.find( p => p.priceId === priceList[i].id );

        if ( !eventTicket ) continue;

        let ticketBuy = await models.EventTicketBuys.create({
            type: customer ? 'user' : 'guest',
            name,
            email,
            quantity: priceList[i].quantity,
            user: customer || undefined,
            eventTicket,
            cart
        }).save();
            
        if (!cart.tickets) cart.tickets = [];
        cart.tickets.push(ticketBuy);
    }

    customer ? cart.user = customer : null;
    cart.type = customer? 'user' : 'guest';
    cart.name = name;
    cart.email = email;
    cart.completed = true;
    cart.dateCompleted = new Date();
    cart.checkIn = false;

    return await cart.save();
}
