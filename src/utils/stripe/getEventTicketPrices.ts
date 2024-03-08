import { stripe } from "./stripe";

export const getEventTicketPrices = async ( id: string, stripeAccount: string, active: boolean = true ) => {
    return await stripe.prices.list({ product: id, active: active }, { stripeAccount });
}
