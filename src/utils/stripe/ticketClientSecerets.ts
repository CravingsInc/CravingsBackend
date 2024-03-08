import { stripe } from "./stripe";
import * as models from '../../models';

export const createPaymentIntent = async ( stripeAccount: string, customer?: string ) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 50,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    customer: customer,
    setup_future_usage: customer ? "off_session" : "on_session",
    transfer_data: {
      destination: stripeAccount
    },

    metadata: {
      guest: customer != undefined || null ? 1 : 0,
      customer: customer || null
    }
  });

  return paymentIntent;
}

export const updatePaymentIntent = async ( id: string, prices: models.TicketBuyClientSecretUpdate[], stripeAccount: string ) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(id);

  let priceList = await Promise.all( prices.map( async ( price ) => {
    const p = await stripe.prices.retrieve( price.id, { stripeAccount } );

    return { amount: p.unit_amount, quantity: price.quantity, id: price.id };
  }) );

  const totalPrice = priceList.reduce( ( prev, curr ) => prev + ( curr.amount || 0 ), 0 );

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
