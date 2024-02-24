import { stripe } from "./stripe";

export const createEventPrice = async ( stripeAccount: string, orgId: string, eventId: string, productId: string, amount: number, currency: string = 'usd' ) => {
    return await stripe.prices.create(
        {
            unit_amount: amount * 100, // Unit amount in center, 100 cents per amount
            currency,
            product: productId,
            metadata: {
                orgId,
                eventId,
            }
        },

        { stripeAccount }
    )
}
