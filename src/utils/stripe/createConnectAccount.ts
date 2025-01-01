import { stripe } from "./stripe";

export enum ConnectAccountType {
    ORGANIZER = 'ORGANIZER',
}

export const createConnectAccount = async ( email: string, userId: string, type: ConnectAccountType = ConnectAccountType.ORGANIZER ) => {
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
            type: ConnectAccountType.ORGANIZER,
            dateJoined: ( new Date() ).getTime() 
        },
        business_type: "individual",

        business_profile: {
            url: `https://www.cravingsinc.us/organizers/${userId}`
        }
    });
}
