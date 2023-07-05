import { stripe } from "./stripe";

export const createConnectAccount = async ( email: string, userId: string ) => {
    return await stripe.accounts.create({
        type: "express",
        email,
        metadata: {
            email,
            userId,
            dateJoined: ( new Date() ).getTime() 
        }
    })
}
