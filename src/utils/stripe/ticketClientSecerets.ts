import { stripe } from "./stripe";
import * as models from '../../models';
import { Utils } from "../Utils";
import Stripe from "stripe";

export enum PAYMENT_INTENT_TYPE {
  TICKET = "TICKET"
}

export const createPaymentIntent = async ( stripeAccount: string, eventId: string, prices: models.TicketBuyClientSecretUpdate[], customer?: string ) => {
  const cart = await models.EventTicketCart.create({
    completed: false,
    eventId
  }).save();

  let priceList = await Promise.all( prices.map( async ( price ) => {
    const p = await stripe.prices.retrieve( price.id, { stripeAccount } );

    return { amount: p.unit_amount, quantity: price.quantity, id: price.id };
  }) );

  const totalPrice = priceList.reduce( ( prev, curr ) => prev + ( ( curr.amount || 0 ) * curr.quantity ), 0 );
  
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
    application_fee_amount: totalPrice * 0.1,

    metadata: {
      customer: customer || null,
      type: PAYMENT_INTENT_TYPE.TICKET,
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

export const updatePaymentIntent = async ( id: string, prices: models.TicketBuyClientSecretUpdate[], stripeAccount: string ) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(id);

  let priceList = await Promise.all( prices.map( async ( price ) => {
    const p = await stripe.prices.retrieve( price.id, { stripeAccount } );

    return { amount: p.unit_amount, quantity: price.quantity, id: price.id };
  }) );

  const totalPrice = priceList.reduce( ( prev, curr ) => prev + ( ( curr.amount || 0 ) * curr.quantity ), 0 );

  const intent = await stripe.paymentIntents.update(
    paymentIntent.id,
    { 
      amount: totalPrice,
      application_fee_amount: totalPrice * 0.1,
      metadata: { priceList: JSON.stringify( priceList ) }
    }
  );

  return intent;
}
