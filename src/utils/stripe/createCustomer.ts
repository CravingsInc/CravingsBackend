import { stripe } from "./stripe";

export const createCustomer = async ( email: string, userId : string, phone: string, type: string = 'user', stripeAccount?: string, metadata?: any ) => {
    return await stripe.customers.create({
        name: userId,
        email: email,
        phone: phone,
        description: `${userId} is a customer on Eventrix. Email: ${email}`,
        metadata: {
            userId,
            email,
            type,
            dateJoined: ( new Date() ).getTime(),
            ...metadata
        }
    }, stripeAccount ? { stripeAccount } : undefined );
}
