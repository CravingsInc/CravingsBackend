import Stripe from "stripe";
import { Utils } from "../Utils";
import { stripe } from "./stripe";

export const getPaymentIntentById = async ( paymentIntentId: string, verifyCompleted: boolean = false ): Promise<Stripe.PaymentIntent | Error> => {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  return verifyCompleted ? 
    paymentIntent.status === 'succeeded' ? 
      paymentIntent : new Utils.CustomError('Payment Intent Not Completed')
    :
    paymentIntent;
};
