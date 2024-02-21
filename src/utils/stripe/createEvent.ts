import { stripe } from "./stripe";

export const createEvent = async ( stripeAccount: string, orgId: string, eventId: string, title: string ) => {
    return stripe.products.create(
        {
            name: title,
            description: `Event Tickets for ${title}`,
            type: 'good',
            metadata: {
                orgId,
                eventId
            }
        },
        {
            stripeAccount
        }
    )
}
