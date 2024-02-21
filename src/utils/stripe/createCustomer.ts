import { stripe } from "./stripe";

export const createCustomer = async ( email: string, userId : string ) => {
    return await stripe.customers.create({
        name: userId,
        email: email,
        description: `${userId} is a customer on Cravings. Email: ${email}`,
        metadata: {
            userId,
            email,
            type: 'user',
            dateJoined: ( new Date() ).getTime()
        }
    });
}
