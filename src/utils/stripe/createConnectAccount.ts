import { stripe } from "./stripe";

export const createConnectAccount = async ( email: string, userId: string ) => {
    return await stripe.accounts.create({
        type: "express",
        email,
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        },
        metadata: {
            email,
            userId,
            type: "organizer",
            dateJoined: ( new Date() ).getTime() 
        }
    })
}
