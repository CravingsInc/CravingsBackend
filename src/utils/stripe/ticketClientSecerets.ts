import { stripe } from "./stripe";
import * as models from '../../models';
import { Utils } from "../Utils";
import Stripe from "stripe";

export enum PAYMENT_INTENT_TYPE {
  TICKET = "TICKET"
}

export const createPaymentIntent = async ( stripeAccount: string, eventId: string, prices: models.TicketBuyClientSecretUpdate[] | number, customer?: string, eventType?: models.EventType ) => {
  const cart = await models.EventTicketCart.create({
    completed: false,
    eventId
  }).save();

  let totalPrice: number;

  let priceList : { amount: number | null, quantity: number, id: string }[] = !Array.isArray(prices) ? [ 
    { amount: prices, quantity: 1, id: eventType || models.EventType.PAID_TICKET }
  ] : []

  if ( Array.isArray( prices ) ) {
    priceList = await Promise.all( prices.map( async ( price ) => {
      const p = await stripe.prices.retrieve( price.id, { stripeAccount } );
  
      return { amount: p.unit_amount, quantity: price.quantity, id: price.id };
    }) );
  
    totalPrice = priceList.reduce( ( prev, curr ) => prev + ( ( curr.amount || 0 ) * curr.quantity ), 0 );
  }else totalPrice = prices;
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalPrice > 0.5 ? totalPrice : 0.5,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    customer: customer,
    setup_future_usage: customer ? "off_session" : "on_session",
    transfer_data: {
      destination: stripeAccount
    },
    application_fee_amount: totalPrice * Utils.APPLICATION_TICKET_FEE,

    metadata: {
      customer: customer || null,
      type: PAYMENT_INTENT_TYPE.TICKET,
      eventType: eventType || models.EventType.PAID_TICKET,
      eventId,
      cart: cart.id,
      priceList: JSON.stringify( priceList )
    }
  });

  cart.stripeTransactionId = paymentIntent.id;
  cart.save();

  return {
    client_secret: paymentIntent.client_secret,
    cartId: cart.id
  };
}

export const updatePaymentIntent = async ( id: string, prices: models.TicketBuyClientSecretUpdate[] | number, stripeAccount: string, eventType?: models.EventType ) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(id);

  let totalPrice: number;

  let priceList = Array.isArray( prices ) ? 
    (
      await Promise.all( prices.map( async ( price ) => {
        const p = await stripe.prices.retrieve( price.id, { stripeAccount } );
    
        return { amount: p.unit_amount, quantity: price.quantity, id: price.id };
      }) )
    ) : [ { amount: prices, quantity: 1, id: eventType || models.EventType.PAID_TICKET } ]

  totalPrice = priceList.reduce( ( prev, curr ) => prev + ( ( curr.amount || 0 ) * curr.quantity ), 0 );

  const intent = await stripe.paymentIntents.update(
    paymentIntent.id,
    { 
      amount: totalPrice,
      application_fee_amount: totalPrice * Utils.APPLICATION_TICKET_FEE,
      metadata: { priceList: JSON.stringify( priceList ) }
    }
  );

  return intent;
}
