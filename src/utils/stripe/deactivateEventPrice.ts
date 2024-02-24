import { stripe } from "./stripe";

export const deactivateEventPrice = async ( stripeAccount: string, priceId: string ) => {
    return await stripe.prices.update(
        priceId, 
        { active: false, expand: ['product'] },
        { stripeAccount }
    );
}
