import { stripe } from "./stripe";

export const createClientSeceret = async ( customer?: string ) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 0,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    customer: customer
  });

  return paymentIntent.client_secret;
}

export const updateClientSecert = async ( clientSecret: string,  ) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(clientSecret);

  const intent = await stripe.paymentIntents.update(
    paymentIntent.id,
    {amount: 1499}
  );
}
